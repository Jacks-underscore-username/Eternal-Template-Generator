package com.author.example_mod.eternal.events;

//? if forge {
import net.minecraftforge.event.RegisterCommandsEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.eventbus.api.SubscribeEvent;
//?} else if neoforge {
/*import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.neoforge.event.RegisterCommandsEvent;
*///?}

import com.author.example_mod.eternal.Events;
import com.mojang.brigadier.CommandDispatcher;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;

import java.util.ArrayList;

//? if forge {
@Mod.EventBusSubscriber(modid =/*$ mod_id_string {*/"ancient_trinkets"/*$}*/, bus = Mod.EventBusSubscriber.Bus.FORGE)
 //?} else if neoforge {
/*@EventBusSubscriber(modid = /^$ mod_id_string {^/"ancient_trinkets"/^$}^/)
 *///?}
public class CommandRegistration {
    @FunctionalInterface
    public interface CommandRegistrationCallback {
        void run(CommandDispatcher<ServerCommandSource> dispatcher, CommandManager.RegistrationEnvironment environment);
    }

    public static class CommandRegistrationEvent implements Events.NormalizedEvent<CommandRegistrationCallback> {
        //? if forge || neoforge
        public ArrayList<CommandRegistrationCallback> callbacks = new ArrayList<>();

        @Override
        public void register(CommandRegistrationCallback callback) {
            //? if fabric {
            /*//? if >= 1.19.4 {
            /^net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> callback.run(dispatcher, environment));
             ^///?} else {
            net.fabricmc.fabric.api.command.v1.CommandRegistrationCallback.EVENT.register((dispatcher, dedicated) -> callback.run(dispatcher, dedicated ? CommandManager.RegistrationEnvironment.DEDICATED : CommandManager.RegistrationEnvironment.INTEGRATED));
            //?}
            *///?} else if forge || neoforge {
            callbacks.add(callback);
             //?}
        }
    }

    //? if forge || neoforge {
    @SubscribeEvent
    private static void registerCommands(RegisterCommandsEvent event) {
        CommandDispatcher<ServerCommandSource> dispatcher = event.getDispatcher();
        //? if >= 1.19.4 || neoforge {
        /*CommandManager.RegistrationEnvironment environment = event.getCommandSelection();
        *///?} else {
        CommandManager.RegistrationEnvironment environment = event.getEnvironment();
        //?}
        for (CommandRegistrationCallback callback : Events.commandRegistration.callbacks)
            callback.run(dispatcher, environment);
    }
    //?}
}
