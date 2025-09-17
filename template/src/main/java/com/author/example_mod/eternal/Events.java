package com.author.example_mod.eternal;

import com.author.example_mod.eternal.events.CommandRegistration;

public class Events {
    public interface NormalizedEvent<T> {
        void register(T callback);
    }
    public static final CommandRegistration.CommandRegistrationEvent commandRegistration = new CommandRegistration.CommandRegistrationEvent();
}
