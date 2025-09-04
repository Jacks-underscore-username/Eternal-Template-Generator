//? if fabric {
package com.author.example_mod.fabric;

import net.fabricmc.api.ModInitializer;
import com.author.example_mod.common.ExampleModCommon;

public class ExampleModFabricCommon implements ModInitializer {
    @Override
    public void onInitialize() {
        ExampleModCommon.init();
    }
}
//?}