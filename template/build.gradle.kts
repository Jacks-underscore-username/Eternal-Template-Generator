import java.util.*
import java.util.Optional
import java.util.function.BiConsumer
import java.util.function.Consumer
import java.util.function.Predicate

plugins {
    `maven-publish`
    kotlin("jvm") version "2.2.0"
    id("dev.architectury.loom") version "1.11-SNAPSHOT"
    id("me.modmuss50.mod-publish-plugin")
}

repositories {
    mavenCentral()
    exclusiveContent {
        forRepository { maven("https://www.cursemaven.com") { name = "CurseForge" } }
        filter { includeGroup("curse.maven") }
    }
    exclusiveContent {
        forRepository { maven("https://api.modrinth.com/maven") { name = "Modrinth" } }
        filter { includeGroup("maven.modrinth") }
    }
    maven("https://maven.neoforged.net/releases/")
    maven("https://maven.architectury.dev/")
    maven("https://modmaven.dev/")
    maven("https://panel.ryuutech.com/nexus/repository/maven-releases/")
}

fun bool(str: String): Boolean = str.lowercase().startsWith("t")

fun boolProperty(key: String): Boolean {
    if (!hasProperty(key)) {
        return false
    }
    return bool(property(key).toString())
}

fun listProperty(key: String): ArrayList<String> {
    if (!hasProperty(key)) {
        return arrayListOf()
    }
    val str = property(key).toString()
    if (str == "UNSET") {
        return arrayListOf()
    }
    return ArrayList(str.split(" "))
}

fun optionalStrProperty(key: String): Optional<String> {
    if (!hasProperty(key)) {
        return Optional.empty()
    }
    val str = property(key).toString()
    if (str == "UNSET") {
        return Optional.empty()
    }
    return Optional.of(str)
}

class VersionRange(
    val min: String,
    val max: String,
) {
    fun asForgelike(): String = "${if (min.isEmpty()) "(" else "["}$min,${max}${if (max.isEmpty()) ")" else "]"}"

    fun asFabric(): String {
        var out = ""
        if (min.isNotEmpty()) {
            out += ">=$min"
        }
        if (max.isNotEmpty()) {
            if (out.isNotEmpty()) {
                out += " "
            }
            out += "<=$max"
        }
        return out
    }
}

fun versionProperty(key: String): VersionRange {
    if (!hasProperty(key)) {
        return VersionRange("", "")
    }
    val list = listProperty(key)
    for (i in 0 until list.size) {
        if (list[i] == "UNSET") {
            list[i] = ""
        }
    }
    return if (list.isEmpty()) {
        VersionRange("", "")
    } else if (list.size == 1) {
        VersionRange(list[0], "")
    } else {
        VersionRange(list[0], list[1])
    }
}

/**
 * Creates a VersionRange unless the value is UNSET
 */
fun optionalVersionProperty(key: String): Optional<VersionRange> {
    val str = optionalStrProperty(key)
    if (!hasProperty(key)) {
        return Optional.empty()
    }
    if (!str.isPresent) {
        return Optional.empty()
    }
    return Optional.of(versionProperty(key))
}

val envFile = project.rootDir.resolve(".env")
val properties = Properties()
if (envFile.exists()) {
    logger.lifecycle("Loading .env file from: ${envFile.absolutePath}")
    envFile.bufferedReader().use { reader ->
        properties.load(reader)
    }
} else {
    logger.lifecycle(".env file not found at: ${envFile.absolutePath}. Defaulting to production mode.")
}

val isInDevMode: Boolean = properties.getProperty("IS_DEV_MODE")?.toBoolean() ?: false

enum class EnvType {
    FABRIC,
    FORGE,
    NEOFORGE,
}

/**
 * Stores core dependency and environment information.
 */
class Env {
    val archivesBaseName: String = optionalStrProperty("archives_base_name").orElse(property("mod.id").toString())

    val mcVersion = versionProperty("deps.core.mc.version_range")

    val loader = property("loom.platform").toString()
    // $start stonecutter-mapper
    val mapper = "yarn"
    // $end stonecutter-mapper
    val isFabric = loader == "fabric"
    val isForge = loader == "forge"
    val isNeo = loader == "neoforge"
    val isCommon = project.parent!!.name == "common"
    val isApi = project.parent!!.name == "api"
    val packFormat = property("deps.pack_format")
    val type =
        if (isFabric) {
            EnvType.FABRIC
        } else if (isForge) {
            EnvType.FORGE
        } else {
            EnvType.NEOFORGE
        }

    val javaVersion =
        if (atMost("1.16.5")) {
            8
        } else if (isExact("1.17.1")) {
            16
        } else if (atMost("1.20.4")) {
            17
        } else {
            21
        }

    val fabricLoaderVersion = versionProperty("deps.core.fabric.loader.version_range")
    val forgeMavenVersion = versionProperty("deps.core.forge.version_range")
    val forgeVersion = VersionRange(extractForgeVer(forgeMavenVersion.min), extractForgeVer(forgeMavenVersion.max))

    // FML language version is usually the first two numbers only.
    private val fgl: String = if (isForge) forgeMavenVersion.min.substring(forgeMavenVersion.min.lastIndexOf("-")) else ""
    val forgeLanguageVersion = VersionRange(if (isForge) fgl.substring(0, fgl.indexOf(".")) else "", "")
    val neoforgeVersion = versionProperty("deps.core.neoforge.version_range")

    // The modloader system is separate from the API in Neo
    val neoforgeLoaderVersion = versionProperty("deps.core.neoforge.loader.version_range")

    fun atLeast(version: String) = stonecutter.compare(mcVersion.min, version) >= 0

    fun atMost(version: String) = stonecutter.compare(mcVersion.min, version) <= 0

    fun isNot(version: String) = stonecutter.compare(mcVersion.min, version) != 0

    fun isExact(version: String) = stonecutter.compare(mcVersion.min, version) == 0

    private fun extractForgeVer(str: String): String {
        val split = str.split("-")
        if (split.size == 1) {
            return split[0]
        }
        if (split.size > 1) {
            return split[1]
        }
        return ""
    }
}
val env = Env()

// In dev mode all dependencies will run in INCLUDE mode for convenience.
enum class DepType {
    API,

    // Optional API
    API_OPTIONAL {
        override fun isOptional(): Boolean = true
    },

    // Implementation
    IMPL,

    // Forge Runtime Library
    FRL {
        override fun includeInDepsList(): Boolean = false
    },

    // Implementation and Included in output jar.
    INCLUDE {
        override fun includeInDepsList(): Boolean = false
    }, ;

    open fun isOptional(): Boolean = false

    open fun includeInDepsList(): Boolean = true
}

class APIModInfo(
    val modid: String?,
    val curseSlug: String?,
    val rinthSlug: String?,
) {
    constructor () : this(null, null, null)
    constructor (modid: String) : this(modid, modid, modid)
    constructor (modid: String, slug: String) : this(modid, slug, slug)
}

/**
 * APIs must have a maven source.
 * If the version range is not present then the API will not be used.
 * If modid is null then the API will not be declared as a dependency in uploads.
 * The enable condition determines whether the API will be used for this version.
 */
class APISource(
    private val realType: DepType,
    val modInfo: APIModInfo,
    val mavenLocation: String,
    val versionRange: Optional<VersionRange>,
    private val enableCondition: Predicate<APISource>,
) {
    val type = if (isInDevMode) { DepType.INCLUDE } else { this.realType }
    val enabled = this.enableCondition.test(this)
}

val apis =
    arrayListOf(
        // $start dependencies
        // $end dependencies
    )

// Stores information about the mod itself.
class ModProperties {
    val id = property("mod.id").toString()
    val displayName = property("mod.display_name").toString()
    val className = property("mod.class_name").toString()
    val version = property("version").toString()
    val description: String = optionalStrProperty("mod.description").orElse("")
    val authors = property("mod.authors").toString()
    val icon = property("mod.icon").toString()
    val issueTracker: String = optionalStrProperty("mod.issue_tracker").orElse("")
    val license: String = optionalStrProperty("mod.license").orElse("")
    val sourceUrl: String = optionalStrProperty("mod.source_url").orElse("")
    val generalWebsite: String = optionalStrProperty("mod.general_website").orElse(sourceUrl)
    val longVersion = "$version+${env.mcVersion.min}+${env.loader}"
    val group: String = optionalStrProperty("group").orElse("com.${authors.lowercase().replace("[^a-zA-Z]".toRegex(), "")}")
    val fileName = "$id-$longVersion.jar"
}

/**
 * Provides access to the mixins for specific environments.
 * All environments are provided the vanilla mixin if it is enabled.
 */
class ModMixins {
    private val enableVanillaMixin: Boolean = boolProperty("mixins.vanilla.enable")
    private val enableFabricMixin: Boolean = boolProperty("mixins.fabric.enable")
    private val enableForgeMixin: Boolean = boolProperty("mixins.forge.enable")
    private val enableNeoforgeMixin: Boolean = boolProperty("mixins.neoforge.enable")

    private val vanillaMixin: String = "mixins.${mod.id}.json"
    private val fabricMixin: String = "mixins.fabric.${mod.id}.json"
    private val forgeMixin: String = "mixins.forge.${mod.id}.json"
    private val neoForgeMixin: String = "mixins.neoforge.${mod.id}.json"
    val extraMixins: Collection<String> = listProperty("mixins.extras")

    /**
     * Modify this method if you need better control over the mixin list.
     */
    fun getMixins(env: EnvType): List<String> {
        val out = arrayListOf<String>()
        if (enableVanillaMixin) out.add(vanillaMixin)
        when (env) {
            EnvType.FABRIC -> if (enableFabricMixin) out.add(fabricMixin)
            EnvType.FORGE -> if (enableForgeMixin) out.add(forgeMixin)
            EnvType.NEOFORGE -> if (enableNeoforgeMixin) out.add(neoForgeMixin)
        }
        return out
    }
}

/**
 * Controls publishing. For publishing to work dryRunMode must be false.
 * Modrinth and Curseforge project tokens are publicly accessible, so it is safe to include them in files.
 * Do not include your API keys in your project!
 *
 * The Modrinth API token should be stored in the MODRINTH_TOKEN environment variable.
 * The curseforge API token should be stored in the CURSEFORGE_TOKEN environment variable.
 */
class ModPublish {
    private val mcTargets = arrayListOf<String>()
    val modrinthProjectToken = property("publish.token.modrinth").toString()
    val curseforgeProjectToken = property("publish.token.curseforge").toString()
    val mavenURL = optionalStrProperty("publish.maven.url")
    val dryRunMode = boolProperty("publish.dry_run")

    init {
        val tempMcTargets = listProperty("publish_acceptable_mc_versions")
        if (tempMcTargets.isEmpty()) {
            mcTargets.add(env.mcVersion.min)
        } else {
            mcTargets.addAll(tempMcTargets)
        }
    }
}
val modPublish = ModPublish()

/**
 * These dependencies will be added to the fabric.mods.json, META-INF/neoforge.mods.toml, and META-INF/mods.toml file.
 */
class ModDependencies {
    private val loadBefore = listProperty("deps.before")

    fun forEachAfter(cons: BiConsumer<String, VersionRange>) {
        forEachRequired(cons)
        forEachOptional(cons)
    }

    fun forEachBefore(cons: Consumer<String>) {
        loadBefore.forEach(cons)
    }

    fun forEachOptional(cons: BiConsumer<String, VersionRange>) {
        apis.forEach { src ->
            if (src.enabled && src.type.isOptional() &&
                src.type.includeInDepsList()
            ) {
                src.versionRange.ifPresent { ver ->
                    src.modInfo.modid?.let {
                        cons.accept(it, ver)
                    }
                }
            }
        }
    }

    fun forEachRequired(cons: BiConsumer<String, VersionRange>) {
        cons.accept("minecraft", env.mcVersion)
        if (env.isForge) {
            cons.accept("forge", env.forgeVersion)
        }
        if (env.isNeo) {
            cons.accept("neoforge", env.neoforgeVersion)
        }
        if (env.isFabric) {
            cons.accept("fabric", env.fabricLoaderVersion)
        }
        apis.forEach { src ->
            if (src.enabled && !src.type.isOptional() &&
                src.type.includeInDepsList()
            ) {
                src.versionRange.ifPresent { ver ->
                    src.modInfo.modid?.let {
                        cons.accept(it, ver)
                    }
                }
            }
        }
    }
}
val dependencies = ModDependencies()

/**
 * These values will change between versions and mod loaders. Handles generation of specific entries in mods.toml and neoforge.mods.toml
 */
class SpecialMultiversionedConstants {
    private val mandatoryIndicator = if (env.isNeo) "required" else "mandatory"
    val mixinField =
        if (env.atMost("1.20.4") && env.isNeo) {
            neoForgeMixinField()
        } else if (env.isFabric) {
            fabricMixinField()
        } else {
            ""
        }

    val forgelikeLoaderVer = if (env.isForge) env.forgeLanguageVersion.asForgelike() else env.neoforgeLoaderVersion.asForgelike()
    val forgelikeAPIVer = if (env.isForge) env.forgeVersion.asForgelike() else env.neoforgeVersion.asForgelike()
    val dependenciesField = if (env.isFabric) fabricDependencyList() else forgelikeDependencyField()
    val excludes = excludes0()

    private fun excludes0(): List<String> {
        val out = arrayListOf<String>()
        if (!env.isForge) {
            // NeoForge before 1.21 still uses the forge mods.toml :/ One of those goofy changes between versions.
            if (!env.isNeo || !env.atLeast("1.20.6")) {
                out.add("META-INF/mods.toml")
            }
        }
        if (!env.isFabric) {
            out.add("fabric.mod.json")
        }
        if (!env.isNeo) {
            out.add("META-INF/neoforge.mods.toml")
        }
        return out
    }

    private fun neoForgeMixinField(): String {
        var out = ""
        for (mixin in modMixins.getMixins(EnvType.NEOFORGE)) {
            out += "[[mixins]]\nconfig=\"${mixin}\"\n"
        }
        return out
    }

    private fun fabricMixinField(): String {
        val list = modMixins.getMixins(EnvType.FABRIC)
        if (list.isEmpty()) {
            return ""
        } else {
            var out = "  \"mixins\" : [\n"
            for ((index, mixin) in list.withIndex()) {
                out += "    \"${mixin}\""
                if (index < list.size - 1) {
                    out += ","
                }
                out += "\n"
            }
            return "$out  ],"
        }
    }

    private fun fabricDependencyList(): String {
        var out = "  \"depends\":{"
        var useComma = false
        dependencies.forEachRequired { modid, ver ->
            if (useComma) {
                out += ","
            }
            out += "\n"
            out += "    \"${modid}\": \"${ver.asFabric()}\""
            useComma = true
        }
        return "$out\n  }"
    }

    private fun forgelikeDependencyField(): String {
        var out = ""
        dependencies.forEachBefore { modid ->
            out += forgeDep(modid, VersionRange("", ""), "BEFORE", false)
        }
        dependencies.forEachOptional { modid, ver ->
            out += forgeDep(modid, ver, "AFTER", false)
        }
        dependencies.forEachRequired { modid, ver ->
            out += forgeDep(modid, ver, "AFTER", true)
        }
        return out
    }

    private fun forgeDep(
        modid: String,
        versionRange: VersionRange,
        order: String,
        mandatory: Boolean,
    ): String =
        "[[dependencies.${mod.id}]]\n" +
            "modId=\"${modid}\"\n" +
            "$mandatoryIndicator=${mandatory}\n" +
            "versionRange=\"${versionRange.asForgelike()}\"\n" +
            "ordering=\"${order}\"\n" +
            "side=\"BOTH\"\n"
}
val mod = ModProperties()
val modMixins = ModMixins()
val dynamics = SpecialMultiversionedConstants()

version = mod.longVersion
group = mod.group

// Adds both optional and required dependencies to stonecutter version checking.
dependencies.forEachAfter { mid, ver ->
    stonecutter.dependencies[mid] = ver.min
}
apis.forEach { src ->
    src.modInfo.modid?.let {
        stonecutter.constants.put(it, src.enabled)
        src.versionRange.ifPresent { ver ->
            stonecutter.dependencies[it] = ver.min
        }
    }
}

stonecutter {
    val map =
        mapOf(
            "mod_id" to mod.id,
            "mod_name" to mod.displayName,
            "authors" to mod.authors,
            "mod_description" to mod.description,
            "mod_website" to mod.generalWebsite,
            "mod_source" to mod.sourceUrl,
            "mod_issues" to mod.issueTracker,
            "mod_group" to mod.group,
            "mod.icon" to mod.icon,
            "mod_license" to mod.license,
            "mod_version" to mod.version,
            "minecraft_version" to env.mcVersion.min,
            "loader" to env.loader,
            "java_version" to env.javaVersion.toString(),
        )

    fun swap(
        name: String,
        value: String,
    ) {
        swaps["${name}_string"] = "\"${value}\""
        swaps[name] = value
    }

    for (entry in map) {
        swap(entry.key, entry.value)
    }

    constants.match(
        env.loader,
        "fabric",
        "neoforge",
        "forge",
    )

    constants.match(
        env.mapper,
        "mojmaps",
        "parchment",
        "yarn",
    )

    constants.put("fabric", env.isFabric)
    constants.put("forge", env.isForge)
    constants.put("neoforge", env.isNeo)

    constants.put("dev_mode", isInDevMode)
}

loom {
    accessWidenerPath = file("../../src/main/resources/example_mod.accesswidener")

    silentMojangMappingsLicense()
    if (env.isForge) {
        forge {
            for (mixin in modMixins.getMixins(EnvType.FORGE)) {
                mixinConfigs(
                    mixin,
                )
            }
        }
    }

    decompilers {
        get("vineflower").apply {
            // Adds names to lambdas - useful for mixins
            options.put("mark-corresponding-synthetics", "1")
        }
    }

    runConfigs.all {
        ideConfigGenerated(true)
        // Provides lots of useful mixin info, including the processed mixin files
        vmArgs("-Dmixin.debug.export=true")
        // $if shared-runs
        runDir = "../../run"
        // $end shared-runs
    }
}

base { archivesName.set(env.archivesBaseName) }

@Suppress("ktlint:standard:no-consecutive-comments")
dependencies {
    minecraft("com.mojang:minecraft:${env.mcVersion.min}")
    /* $if mappings-mojmaps
    mappings(loom.officialMojangMappings())
       $end mappings-mojmaps */
    /* $if mappings-parchment
    mappings(
        loom.layered {
            officialMojangMappings()
            parchment("org.parchmentmc.data:parchment-${env.mcVersion.min}:${property("deps.mappings.parchment")}@zip")
        },
    )
       $end mappings-parchment */
    // $if mappings-yarn
    mappings(
        loom.layered {
            mappings("net.fabricmc:yarn:${property("deps.mappings.yarn")}:v2")
            val patch = optionalStrProperty("deps.mappings.yarn.patch")
            if (patch.isPresent) {
                mappings("dev.architectury:yarn-mappings-patch-${env.loader}:${patch.get()}")
            }
        },
    )
    // $end mappings-yarn

    if (env.isFabric) {
        modImplementation("net.fabricmc:fabric-loader:${env.fabricLoaderVersion.min}")
    }
    if (env.isForge) {
        "forge"("net.minecraftforge:forge:${env.forgeMavenVersion.min}")
    }
    if (env.isNeo) {
        "neoForge"("net.neoforged:neoforge:${env.neoforgeVersion.min}")
    }

    apis.forEach { src ->
        if (src.enabled) {
            src.versionRange.ifPresent { ver ->
                if (src.type == DepType.API || src.type == DepType.API_OPTIONAL) {
                    modApi("${src.mavenLocation}:${ver.min}")
                }
                if (src.type == DepType.IMPL) {
                    modImplementation("${src.mavenLocation}:${ver.min}")
                }
                if (src.type == DepType.FRL && env.isForge) {
                    "forgeRuntimeLibrary"("${src.mavenLocation}:${ver.min}")
                }
                if (src.type == DepType.INCLUDE) {
                    modImplementation("${src.mavenLocation}:${ver.min}")
                    include("${src.mavenLocation}:${ver.min}")
                }
            }
        }
    }

    vineflowerDecompilerClasspath("org.vineflower:vineflower:1.10.1")
}

java {
    withSourcesJar()
    val java =
        when (env.javaVersion) {
            8 -> JavaVersion.VERSION_1_8
            16 -> JavaVersion.VERSION_16
            17 -> JavaVersion.VERSION_17
            21 -> JavaVersion.VERSION_21
            else -> throw Error("Unknown java version used")
        }
    targetCompatibility = java
    sourceCompatibility = java
}

/**
 * Replaces the normal copy task and post-processes the files.
 * Effectively renames datapack directories due to depluralization past 1.20.4.
 * TODO: acknowledge that you should not pluralize the directories listed in targets.
 */

abstract class ProcessResourcesExtension : ProcessResources() {
    // TODO: The modid needs setting here too sadly
    // $start pure-id
    private val id: String = "example_mod"
    // $end pure-id

    @get:Input
    val autoPluralize =
        arrayListOf(
            "/data/minecraft/tags/block",
            "/data/minecraft/tags/item",
            "/data/$id/loot_table",
            "/data/$id/recipe",
            "/data/$id/tags/item",
        )

    override fun copy() {
        super.copy()
        val root = destinationDir.absolutePath
        autoPluralize.forEach { path ->
            val file = File(root.plus(path))
            if (file.exists()) {
                file.copyRecursively(File(file.absolutePath.plus("s")), true)
                file.deleteRecursively()
            }
        }
    }
}

if (env.atMost("1.20.6")) {
    tasks.replace("processResources", ProcessResourcesExtension::class)
}

tasks.processResources {
    val map =
        mapOf(
            "modid" to mod.id,
            "id" to mod.id,
            "name" to mod.displayName,
            "display_name" to mod.displayName,
            "version" to mod.version,
            "description" to mod.description,
            "authors" to mod.authors,
            "github_url" to mod.sourceUrl,
            "source_url" to mod.sourceUrl,
            "website" to mod.generalWebsite,
            "icon" to mod.icon,
            "fabric_common_entry" to "${mod.group}.${env.archivesBaseName}.fabric.${mod.className}FabricCommon",
            "fabric_client_entry" to "${mod.group}.${env.archivesBaseName}.fabric.${mod.className}FabricClient",
            "mc_min" to env.mcVersion.min,
            "mc_max" to env.mcVersion.max,
            "issue_tracker" to mod.issueTracker,
            "java_ver" to env.javaVersion.toString(),
            "forgelike_loader_ver" to dynamics.forgelikeLoaderVer,
            "forgelike_api_ver" to dynamics.forgelikeAPIVer,
            "loader_id" to env.loader,
            "license" to mod.license,
            "mixin_field" to dynamics.mixinField,
            "dependencies_field" to dynamics.dependenciesField,
            "pack_format" to env.packFormat
        )
    inputs.properties(map)
    dynamics.excludes.forEach { file ->
        exclude(file)
    }

    filesMatching("pack.mcmeta") { expand(map) }
    filesMatching("fabric.mod.json") { expand(map) }
    filesMatching("META-INF/mods.toml") { expand(map) }
    filesMatching("META-INF/neoforge.mods.toml") { expand(map) }
    modMixins.getMixins(env.type).forEach { str -> filesMatching(str) { expand(map) } }
}

// Copy the created jars over to a central location, so you don't have to dig through all those folders *every time*.
tasks.register("moveJars", Copy::class) {
    val fromFolder = layout.buildDirectory.dir("libs").get()
    from(fromFolder)
    val toFolder = layout.projectDirectory.dir("../../build/libs")
    into(toFolder)
    val fileName = mod.fileName
    include(fileName)
    doLast {
        delete(fromFolder.file(fileName))
        println("Moved $fileName from $fromFolder to $toFolder")
    }
}

tasks.clean {
    delete(layout.projectDirectory.dir("../../build/libs"))
}

tasks.build {
    finalizedBy(tasks.getByName("moveJars"))
}

// TODO: Enable auto-publishing.

/*publishMods {
    file = tasks.remapJar.get().archiveFile
    additionalFiles.from(tasks.remapSourcesJar.get().archiveFile)
    displayName = "${mod.displayName} ${mod.version} for ${env.mcVersion.min}"
    version = mod.version
    changelog = rootProject.file("CHANGELOG.md").readText()
    type = STABLE
    modLoaders.add(env.loader)

    dryRun = modPublish.dryRunMode

    modrinth {
        projectId = modPublish.modrinthProjectToken
        // Get one here: https://modrinth.com/settings/pats, enable read, write, and create Versions ONLY!
        accessToken = providers.environmentVariable("MODRINTH_TOKEN")
        minecraftVersions.addAll(modPublish.mcTargets)
        apis.forEach{ src ->
            if(src.enabled) src.versionRange.ifPresent{ ver ->
                if(src.type.isOptional()){
                    src.modInfo.rinthSlug?.let {
                        optional {
                            slug = it
                            version = ver.min

                        }
                    }
                }
                else{
                    src.modInfo.rinthSlug?.let {
                        requires {
                            slug = it
                            version = ver.min
                        }
                    }
                }
            }
        }
    }

    curseforge {
        projectId = modPublish.curseforgeProjectToken
        // Get one here: https://legacy.curseforge.com/account/api-tokens
        accessToken = providers.environmentVariable("CURSEFORGE_TOKEN")
        minecraftVersions.addAll(modPublish.mcTargets)
        apis.forEach{ src ->
            if(src.enabled) src.versionRange.ifPresent{ ver ->
                if(src.type.isOptional()){
                    src.modInfo.curseSlug?.let {
                        optional {
                            slug = it
                            version = ver.min

                        }
                    }
                }
                else{
                    src.modInfo.curseSlug?.let {
                        requires {
                            slug = it
                            version = ver.min
                        }
                    }
                }
            }
        }
    }
}
// TODO Disable if not uploading to a maven
publishing {
    repositories {
        // TODO this is an example_mod of how I recommend you do this.
        if(modPublish.mavenURL.isPresent) {
            maven {
                url = uri(modPublish.mavenURL.get())
                credentials {
                    username = System.getenv("MVN_NAME")
                    password = System.getenv("MVN_KEY")
                }
            }
        }
    }
    publications {
        create<MavenPublication>("mavenJava"){
            groupId = project.group.toString()
            artifactId = env.archivesBaseName
            version = project.version.toString()
            from(components["java"])
        }
    }
}*/
