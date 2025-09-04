//? if fabric {
package com.author.example_mod.fabric;

import net.fabricmc.api.ClientModInitializer;
import com.author.example_mod.client.ExampleModClient;

public class ExampleModFabricClient implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        ExampleModClient.init();
    }
}
//?}
