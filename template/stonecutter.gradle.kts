plugins {
    id("dev.kikugie.stonecutter") version "0.7.9"
    id("dev.architectury.loom") version "1.11-SNAPSHOT" apply false
    id("me.modmuss50.mod-publish-plugin") version "0.5.+" apply false
    id("architectury-plugin") version "3.4-SNAPSHOT" apply false
}

// $start stonecutter-active
stonecutter active "1.21.8-fabric"
// $end stonecutter-active
