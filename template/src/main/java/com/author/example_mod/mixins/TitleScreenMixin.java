// $if mappings-yarn
package com.author.example_mod.mixins;

//? if > 1.18.1 {
import com.mojang.logging.LogUtils;
import org.slf4j.Logger;
//? }
import net.minecraft.client.gui.screen.TitleScreen;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(TitleScreen.class)
public class TitleScreenMixin {
    //? if > 1.18.1
    private static final Logger LOGGER = LogUtils.getLogger();

    @Inject(method = "init", at = @At("HEAD"))
    public void initMixinExample(CallbackInfo ci) {
        String baseString = "Hello from %LOADER% on Minecraft %VERSION%";

        /// https://stonecutter.kikugie.dev/stonecutter/guide/comments
        String loader =  /*$ loader_string {*/""/*$}*/;
        String version = /*$ minecraft_version_string {*/""/*$}*/;

        baseString = baseString.replace("%LOADER%",loader);
        baseString = baseString.replace("%VERSION%",version);

        //? if > 1.18.1
        LOGGER.info(baseString);

        TitleScreen titleScreen = (TitleScreen) (Object) this;

        if (titleScreen.client != null) {
            //? if > 1.18.1
            LOGGER.info("Manually exiting");
            titleScreen.client.scheduleStop();
        }
    }
}
// $end mappings-yarn