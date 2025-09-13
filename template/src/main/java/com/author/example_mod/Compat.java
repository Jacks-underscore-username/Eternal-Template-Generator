package com.author.example_mod;

//? if (forge && <= 1.18) || <= 1.16.5 {
/*import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.LogManager;
*///?} else {
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
//?}

public class Compat {
    //? if (forge && <= 1.18) || <= 1.16.5 {
    /*public static final Logger LOGGER = LogManager.getLogger(/^$ mod_id_string {^/"example_mod"/^$}^/);
     *///?} else {
    public static final Logger LOGGER = LoggerFactory.getLogger(/*$ mod_id_string {*/"example_mod"/*$}*/);
    //?}
}
