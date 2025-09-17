package com.author.example_mod.mixins;

import com.author.example_mod.eternal.Utils;
import net.minecraft.client.gui.screen.TitleScreen;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(TitleScreen.class)
public class TitleScreenMixin {
    @Inject(method = "init", at = @At("HEAD"))
    public void initMixinExample(CallbackInfo ci) {
        String baseString = "Hello from %LOADER% on Minecraft %VERSION%";

        /// https://stonecutter.kikugie.dev/stonecutter/guide/comments
        String loader =  /*$ loader_string {*/"fabric"/*$}*/;
        String version = /*$ minecraft_version_string {*/"1.21.8"/*$}*/;

        baseString = baseString.replace("%LOADER%",loader);
        baseString = baseString.replace("%VERSION%",version);

        Utils.LOGGER.info(baseString);

        TitleScreen titleScreen = (TitleScreen) (Object) this;

        if (titleScreen.client != null) {
            Utils.LOGGER.info("Manually exiting");
            titleScreen.client.scheduleStop();
        }
    }
}