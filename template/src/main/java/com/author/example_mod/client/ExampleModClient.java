package com.author.example_mod.client;

import com.author.example_mod.Compat;
//? if neoforge {
/*import net.neoforged.fml.ModContainer;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.event.lifecycle.FMLClientSetupEvent;
*///?} else if forge {
/*import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent;
*///?}

/**
 * This is the entry point for your mod's client side, called by each modloader specific side.
 */
public class ExampleModClient {
    //? if fabric {
    public static void init() {
    //?} else if neoforge {
    /*public static void init(FMLClientSetupEvent event, IEventBus eventBus, ModContainer modContainer) {
    *///?} else if forge {
    /*public static void init(FMLClientSetupEvent event, IEventBus eventBus, FMLJavaModLoadingContext context) {
    *///?}
        Compat.LOGGER.info("Hello from the client side!");
    }
}
