import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import kotlin.ranges.IntRange

plugins {
    id("dev.kikugie.stonecutter") version "0.7.9"
    id("dev.architectury.loom") version "1.11-SNAPSHOT" apply false
    id("me.modmuss50.mod-publish-plugin") version "0.5.+" apply false
    id("architectury-plugin") version "3.4-SNAPSHOT" apply false
    id("com.dorongold.task-tree") version "4.0.1"
}

// $start stonecutter-active
// $end stonecutter-active


var lastRun: String? = null
var taskIndex = 0
val taskCount = stonecutter.versions.size
for (version in stonecutter.versions.map { ver -> ver.project }) {
    val isFirst = taskIndex == 0
    val currentLastRun = lastRun
    taskIndex++
    val name = "runAllClientsSequentially $version ($taskIndex-$taskCount)"
    val taskPath = ":$version:runClient"
    tasks.register(name) {
        group = "eternal-impl"
        if (isFirst) {
            doFirst {
                val sharedLogDir =
                    project.layout.buildDirectory
                        .dir("logs")
                        .get()
                        .asFile
                if (!sharedLogDir.exists()) {
                    sharedLogDir.mkdirs()
                }
                for (file in sharedLogDir.listFiles()!!) {
                    val fileName = file.name.toString()
                    if (fileName.contains("latest_")) {
                        val newFileName = fileName.slice(IntRange(7, fileName.length - 1))
                        println("Renamed $fileName to $newFileName")
                        file.renameTo(File(sharedLogDir, newFileName))
                    }
                }
                for (subVersion in stonecutter.versions.map { ver -> ver.project }) {
                    val subLogDir =
                        project.layout.buildDirectory
                            .dir("../versions/$version/build/logs")
                            .get()
                            .asFile
                    if (!subLogDir.exists()) {
                        subLogDir.mkdirs()
                    }
                    for (file in subLogDir.listFiles()!!) {
                        val fileName = file.name.toString()
                        if (fileName.contains("latest_")) {
                            val newFileName = fileName.slice(IntRange(7, fileName.length - 1))
                            println("Renamed $fileName to $newFileName")
                            file.renameTo(File(subLogDir, newFileName))
                        }
                    }
                }
            }
        }

        doLast {
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
            val timestamp = SimpleDateFormat("yyyy.MM.dd_HH.mm.ss").format(Date())
            val logFileName = "latest_runClient_${version}_$timestamp.log"
            val sharedLogFile = File(sharedLogDir, logFileName)

            logger.lifecycle("--- Starting client task: $taskPath ---")
            logger.lifecycle("--- Logging output to: ${sharedLogFile.absolutePath} ---")

            try {
                project
                    .exec {
                        workingDir = project.rootDir
                        commandLine(
                            "bash",
                            "-c",
                            "${project.gradle.gradleHomeDir}/bin/gradle $taskPath --console=plain --info --stacktrace > ${sharedLogFile.absolutePath} 2>&1",
                        )
                    }.assertNormalExitValue()
                logger.lifecycle("--- Finished client task: $taskPath successfully ---")
            } catch (e: Exception) {
                logger.error("Client '$taskPath' failed or exited with an error: ${e.message}")
            }

            sharedLogFile.copyTo(File(subLogDir,logFileName))
        }

        if (currentLastRun != null) {
            dependsOn(tasks.getByName(currentLastRun))
        }
    }
    lastRun = name
}

if (lastRun != null) {
    tasks.register("runAllClientsSequentially") {
        group = "eternal"
        dependsOn(tasks.getByName(lastRun!!))
    }
}
