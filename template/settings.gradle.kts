pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven("https://maven.fabricmc.net/")
        maven("https://maven.architectury.dev")
        maven("https://maven.minecraftforge.net/")
        maven("https://maven.neoforged.net/releases/")
        maven("https://repo.spongepowered.org/maven")
        maven("https://maven.kikugie.dev/snapshots")
        maven("https://maven.kikugie.dev/releases")
    }
    plugins {
        kotlin("jvm") version "2.2.0"
    }
}

plugins {
    id("dev.kikugie.stonecutter") version "0.7.9"
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}
stonecutter {
    kotlinController = true
    centralScript = "build.gradle.kts"

    create(rootProject) {
        fun ver(
            mcVersion: String,
            vararg loaders: String,
        ) {
            for (loader in loaders) {
                version("$mcVersion-$loader", mcVersion)
            }
        }
        // $start stonecutter-versions
        // $end stonecutter-versions
        // $start stonecutter-vcs
        // $end stonecutter-vcs
    }
}

rootProject.name = extra["mod.id"] as String
