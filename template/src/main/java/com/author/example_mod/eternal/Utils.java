package com.author.example_mod.eternal;

//? if (forge && <= 1.18) || <= 1.16.5 {
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.LogManager;
//?} else {
/*import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
*///?}
import net.minecraft.text.Text;

public class Utils {
    //? if (forge && <= 1.18) || <= 1.16.5 {
    public static final Logger LOGGER = LogManager.getLogger(/*$ mod_id_string {*/"ancient_trinkets"/*$}*/);
    //?} else {
    /*public static final Logger LOGGER = LoggerFactory.getLogger(/^$ mod_id_string {^/"ancient_trinkets"/^$}^/);
     *///?}

    public static Text literalText(String string) {
        //? if >= 1.20.1 {
        /*return Text.literal(string);
        *///?} else {
        return Text.of(string);
        //?}
    }
}
