import org.gradle.api.DefaultTask
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.TaskAction
import org.gradle.process.ExecOperations
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.HashMap
import javax.inject.Inject

plugins {
    id("dev.kikugie.stonecutter") version "0.7.10"
    id("dev.architectury.loom") version "1.11-SNAPSHOT" apply false
    id("me.modmuss50.mod-publish-plugin") version "0.5.+" apply false
    id("architectury-plugin") version "3.4-SNAPSHOT" apply false
    id("com.dorongold.task-tree") version "4.0.1"
}

// $start stonecutter-active
// $end stonecutter-active

abstract class RunClientForVersionTask
    @Inject
    constructor(
        private val execOperations: ExecOperations,
    ) : DefaultTask() {
        @get:Input
        var version: String = ""

        @get:Input
        var isFirstRun: Boolean = false

        init {
            group = "eternal-impl"
        }

        @TaskAction
        fun runClient() {
            val taskPath = ":$version:runClient"

            val sharedLogDir =
                project.layout.buildDirectory
                    .dir("logs")
                    .get()
                    .asFile
            if (!sharedLogDir.exists()) {
                sharedLogDir.mkdirs()
            }

            val subLogDir =
                project.layout.buildDirectory
                    .dir("../versions/$version/build/logs")
                    .get()
                    .asFile
            if (!subLogDir.exists()) {
                subLogDir.mkdirs()
            }

            if (isFirstRun) {
                project.logger.lifecycle("Performing initial log directory cleanup.")
                for (file in sharedLogDir.listFiles() ?: emptyArray()) {
                    val fileName = file.name
                    if (fileName.contains("latest_")) {
                        val newFileName = fileName.substring(7)
                        project.logger.lifecycle("Renamed $fileName to $newFileName")
                        file.renameTo(File(sharedLogDir, newFileName))
                    }
                }
            }
            for (file in subLogDir.listFiles() ?: emptyArray()) {
                val fileName = file.name
                if (fileName.contains("latest_")) {
                    val newFileName = fileName.substring(7)
                    project.logger.lifecycle("Renamed $fileName to $newFileName")
                    file.renameTo(File(subLogDir, newFileName))
                }
            }

            val timestamp = SimpleDateFormat("yyyy.MM.dd_HH.mm.ss").format(Date())
            val currentLogFileName = "latest_runClient_${version}_$timestamp.log"
            val actualSharedLogFile = File(sharedLogDir, currentLogFileName)

            project.logger.lifecycle("--- Starting client task: $taskPath ---")
            project.logger.lifecycle("--- Logging output to: ${actualSharedLogFile.absolutePath} ---")

            val outputStream = ByteArrayOutputStream()
            val errorStream = ByteArrayOutputStream()

            try {
                execOperations
                    .exec {
                        workingDir = project.rootDir
                        commandLine(
                            "${project.gradle.gradleHomeDir}/bin/gradle",
                            taskPath,
                            "--console=plain",
                            "--info",
                            "--stacktrace",
                        )
                        standardOutput = outputStream
                        errorOutput = errorStream
                        isIgnoreExitValue = true
                    }.assertNormalExitValue()

                actualSharedLogFile.writeBytes(outputStream.toByteArray())
                if (errorStream.size() > 0) {
                    actualSharedLogFile.appendBytes("\n--- ERROR OUTPUT ---\n".toByteArray())
                    actualSharedLogFile.appendBytes(errorStream.toByteArray())
                }

                project.logger.lifecycle("--- Finished client task: $taskPath successfully ---")
            } catch (e: Exception) {
                actualSharedLogFile.writeBytes(outputStream.toByteArray())
                if (errorStream.size() > 0) {
                    actualSharedLogFile.appendBytes("\n--- ERROR OUTPUT ---\n".toByteArray())
                    actualSharedLogFile.appendBytes(errorStream.toByteArray())
                }
                project.logger.error("Client '$taskPath' failed or exited with an error: ${e.message}")
            }

            File(subLogDir, currentLogFileName).writeBytes(actualSharedLogFile.readBytes())
        }
    }

var lastRunTaskName: String? = null
var taskCounter = 0
val totalTaskCount = stonecutter.versions.size

for (stonecutterVersion in stonecutter.versions.map { ver -> ver.project }) {
    val isFirst = taskCounter == 0
    taskCounter++
    val currentTaskName = "runAllClientsSequentially $stonecutterVersion ($taskCounter-$totalTaskCount)"

    val realLastTaskName = lastRunTaskName
    val lastTask = if (realLastTaskName == null) null else tasks.named(realLastTaskName)

    tasks.register<RunClientForVersionTask>(currentTaskName) {
        group = "eternal-impl"
        version = stonecutterVersion
        isFirstRun = isFirst

        if (lastTask != null) {
            dependsOn(lastTask)
        }
    }
    lastRunTaskName = currentTaskName
}

if (lastRunTaskName != null) {
    tasks.register("runAllClientsSequentially") {
        group = "eternal"
        description = "Runs all Minecraft clients for all Stonecutter versions sequentially."
        dependsOn(tasks.named(lastRunTaskName!!))
    }
}

val sortedStonecutterVersions = stonecutter.versions.map { version -> version.project }.sorted()
val checkReflectionGetInputsTask = tasks.register("checkReflection-getInputs") {
    group = "eternal-impl"
    val subTasks = sortedStonecutterVersions.map { version -> tasks.getByPath(":${version}:checkReflection $version") }
    doLast {
        println("Please enter the reflection input (e.g., 'FIND STATIC_METHOD net.minecraft.text.Text net.minecraft.text.Text String'):")
        val userInput: String = System.`in`.bufferedReader().readLine().trim()

        tasks.getByName("checkReflection").extra.set("input", userInput)

        for (task in subTasks)
            task.extra.set("input", userInput)
    }
}

tasks.register("checkReflection") {
    group = "eternal"
    description = "Checks for existence of classes, fields, and methods."
    val tasks = sortedStonecutterVersions.map { version -> tasks.getByPath(":${version}:checkReflection $version") }
    for (task in tasks)
        task.dependsOn(checkReflectionGetInputsTask)
    dependsOn(checkReflectionGetInputsTask)
    dependsOn(tasks)
    doLast {
        val results = tasks.map { task -> task.extra.get("output").toString() }
        val uniqueResults = HashMap<String, ArrayList<String>>()
        for ((index, result) in results.withIndex()) {
            val version = sortedStonecutterVersions[index]
            uniqueResults[result]?.add(version)
            if (!uniqueResults.contains(result))
                uniqueResults[result] = arrayListOf(version)
        }
        println("Results for '${this.extra.get("input")}'")
        for (entry in uniqueResults)
            println(entry.value.joinToString(", ") + ":\n" + entry.key)
    }
}