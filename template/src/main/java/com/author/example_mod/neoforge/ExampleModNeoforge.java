//? if neoforge {
/*package com.author.example_mod.neoforge;

import com.author.example_mod.client.ExampleModClient;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.Mod;
import com.author.example_mod.common.ExampleModCommon;
import net.neoforged.fml.event.lifecycle.FMLClientSetupEvent;
import net.neoforged.fml.event.lifecycle.FMLCommonSetupEvent;

@Mod(/^$ mod_id_string {^/"example_mod"/^$}^/)
public class ExampleModNeoforge {
    public ExampleModNeoforge(IEventBus eventBus, ModContainer modContainer) {
        eventBus.addListener((final FMLClientSetupEvent event) -> ExampleModClient.init(event, eventBus, modContainer));
        eventBus.addListener((final FMLCommonSetupEvent event) -> ExampleModCommon.init(event, eventBus, modContainer));
    }
}
*///?}