package com.author.example_mod.common;

import com.author.example_mod.Compat;
//? if neoforge {
/*import net.neoforged.fml.ModContainer;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.event.lifecycle.FMLCommonSetupEvent;
*///?} else if forge {
/*import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
*///?}

/**
 * This is the entry point for your mod's common side, called by each modloader specific side.
 */
public class ExampleModCommon {
    //? if fabric {
    public static void init() {
    //?} else if neoforge {
    /*public static void init(FMLCommonSetupEvent event, IEventBus eventBus, ModContainer modContainer) {
    *///?} else if forge {
    /*public static void init(FMLCommonSetupEvent event, IEventBus eventBus, FMLJavaModLoadingContext context) {
    *///?}
        Compat.LOGGER.info("Hello from the common side!");
    }
}
