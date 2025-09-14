//? if forge {
/*package com.author.example_mod.forge;

import com.author.example_mod.client.ExampleModClient;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.common.Mod;
import com.author.example_mod.common.ExampleModCommon;
import net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

@Mod(/^$ mod_id_string {^/"example_mod"/^$}^/)
public class ExampleModForge {
    public ExampleModForge() {
        FMLJavaModLoadingContext context = FMLJavaModLoadingContext.get();
        IEventBus eventBus = context.getModEventBus();

        eventBus.addListener((final FMLClientSetupEvent event) -> ExampleModClient.init(event, eventBus, context));
        eventBus.addListener((final FMLCommonSetupEvent event) -> ExampleModCommon.init(event, eventBus, context));
    }
}
*///?}
