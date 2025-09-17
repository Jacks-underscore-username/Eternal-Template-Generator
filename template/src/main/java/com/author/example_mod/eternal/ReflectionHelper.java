package com.author.example_mod.eternal;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Checks if given classes exist.
 * CHECK CLASS [class]
 * Checks if given elements exist.
 * CHECK ElementType class [element]
 * Checks if given methods exist respecting params.
 * CHECK <ElementType extends method> class [element] (inputs: [class])
 * Finds all classes gotten from matching FindTypes in parent classes respecting params.
 * FIND [FindType] parent: [class] target [class] (inputs: [class])
 */

public class ReflectionHelper {

    private enum SearchType {
        CHECK,
        FIND
    }

    private enum FindType {
        INSTANCE_FIELD,
        STATIC_FIELD,
        INSTANCE_METHOD,
        STATIC_METHOD
    }

    private enum ElementType {
        CLASS,
        INSTANCE_FIELD,
        STATIC_FIELD,
        INSTANCE_METHOD,
        STATIC_METHOD
    }

    public static void main(String[] rawArgs) throws RuntimeException {
        String rawArg = Arrays.stream(rawArgs).reduce((prev, arg) -> prev + arg).orElse("").trim();
        ArgList args = separateArgs(rawArg);

        SearchType searchType = SearchType.valueOf(args.at(0).getString());

        /*
         * CHECK CLASS [class]
         * CHECK ElementType class [element]
         * CHECK <ElementType extends method> class [element] (inputs: [class])
         */
        if (searchType.equals(SearchType.CHECK)) {
            ElementType elementType = ElementType.valueOf(args.at(1).getString());
            /*
             * CHECK CLASS [class]
             */
            if (elementType.equals(ElementType.CLASS)) {
                for (Arg arg : args.at(2).asList()) {
                    Optional<Class<?>> parentClass = getClass(arg.getString());
                    if (parentClass.isPresent()) System.out.println(" * Class " + arg.getString() + " exists.");
                    else System.out.println(" * Class " + arg.getString() + " does not exist.");
                }
            }
            /*
             * CHECK ElementType class [element]
             * CHECK <ElementType extends method> class [element] (inputs: [class])
             */
            else {
                Class<?> parentClass = getClass(args.at(2).getString()).orElseThrow(() -> new RuntimeException("Invalid parent class: " + args.at(2).getString()));
                List<Class<?>> paramTypes = new ArrayList<>();
                for (Arg className : args.atOr(4, new ArgList()).asList())
                    paramTypes.add(getClass(className.getString()).orElseThrow(() -> new RuntimeException("Invalid param class: " + className)));

                for (Arg arg : args.at(3).asList()) {
                    if (elementType.equals(ElementType.INSTANCE_FIELD) || elementType.equals(ElementType.STATIC_FIELD))
                        checkField(parentClass, arg.getString(), elementType.equals(ElementType.STATIC_FIELD));
                    else if (elementType.equals(ElementType.INSTANCE_METHOD) || elementType.equals(ElementType.STATIC_METHOD))
                        checkMethod(parentClass, arg.getString(), elementType.equals(ElementType.STATIC_METHOD), paramTypes.toArray(new Class<?>[0]));
                    else
                        System.out.println(" * Class " + arg.getString() + (getClass(arg.getString()).isPresent() ? " exists." : " does not exist."));
                }
            }
        }
        /*
         * FIND [FindType] parent: [class] target: [class] (inputs: [class])
         */
        else {
            List<FindType> findTypes = args.at(1).asList().stream()
                    .map(arg -> FindType.valueOf(arg.getString())).collect(Collectors.toList());

            List<Class<?>> parentClasses = new ArrayList<>();
            for (Arg className : args.at(2).asList())
                parentClasses.add(getClass(className.getString()).orElseThrow(() -> new RuntimeException("Invalid parent class: " + className)));

            List<Class<?>> targetTypes = new ArrayList<>();
            for (Arg className : args.at(3).asList())
                targetTypes.add(getClass(className.getString()).orElseThrow(() -> new RuntimeException("Invalid target class: " + className)));

            Set<Class<?>> validParamTypes = new HashSet<>();
            for (Arg className : args.atOr(4, new ArgList()).asList())
                validParamTypes.add(getClass(className.getString()).orElseThrow(() -> new RuntimeException("Invalid param class: " + className)));

            for (FindType findType : findTypes)
                for (Class<?> parentClass : parentClasses)
                    for (Class<?> targetType : targetTypes)
                        switch (findType) {
                            case INSTANCE_FIELD:
                                findFields(parentClass, targetType, false).forEach(field ->
                                        System.out.println(" * Found instance field: " + parentClass.getName() + "#" + field.getName() + " (Type: " + field.getType().getName() + ")")
                                );
                                break;
                            case STATIC_FIELD:
                                findFields(parentClass, targetType, true).forEach(field ->
                                        System.out.println(" * Found static field: " + parentClass.getName() + "#" + field.getName() + " (Type: " + field.getType().getName() + ")")
                                );
                                break;
                            case INSTANCE_METHOD:
                                findMethods(parentClass, targetType, false, validParamTypes).forEach(method ->
                                        System.out.println(" * Found instance method: " + parentClass.getName() + "#" + method.getName() + formatParamTypes(method.getParameterTypes()) + " -> " + method.getReturnType().getName())
                                );
                                break;
                            case STATIC_METHOD:
                                findMethods(parentClass, targetType, true, validParamTypes).forEach(method ->
                                        System.out.println(" * Found static method: " + parentClass.getName() + "#" + method.getName() + formatParamTypes(method.getParameterTypes()) + " -> " + method.getReturnType().getName())
                                );
                                break;
                        }
        }
    }

    private interface Arg {
        String toString();

        String getString() throws RuntimeException;

        List<Arg> asList();
    }

    private static class ArgString implements Arg {
        public ArgString(String string) {
            this.string = string;
        }

        public final String string;

        @Override
        public String toString() {
            return string;
        }

        @Override
        public String getString() {
            return string;
        }

        @Override
        public List<Arg> asList() {
            List<Arg> list = new ArrayList<>();
            list.add(this);
            return list;
        }
    }

    private static class ArgList implements Arg {
        public ArgList() {
            items = new ArrayList<>();
        }

        public final ArrayList<Arg> items;

        public void add(Arg arg) {
            items.add(arg);
        }

        public Arg at(int index) {
            return items.get(index);
        }

        public Arg atOr(int index, Arg or) {
            return items.size() > index ? items.get(index) : or;
        }

        @Override
        public String toString() {
            if (items.isEmpty()) return "[]";
            return "[" + items.stream().map(Arg::toString).reduce((prev, item) -> prev + ", " + item).get() + "]";
        }

        @Override
        public String getString() throws RuntimeException {
            throw new RuntimeException("Attempting to read ArgList as ArgString");
        }

        @Override
        public List<Arg> asList() {
            return items;
        }
    }

    private static ArgList separateArgs(String rawArg) {
        rawArg += " ";
        ArgList args = new ArgList();
        StringBuilder currentArg = new StringBuilder();
        int parenDepth = 0;
        for (String c : rawArg.split("")) {
            if (c.equals("("))
                parenDepth++;
            if (c.equals(" ") && parenDepth == 0) {
                String currentString = currentArg.toString();
                if (currentString.contains(" ")) args.add(separateArgs(currentString));
                else args.add(new ArgString(currentString));
                currentArg = new StringBuilder();
            } else if (parenDepth != 1 || (!c.equals("(") && !c.equals(")"))) currentArg.append(c);
            if (c.equals(")"))
                parenDepth--;
        }

        return args;
    }

    private static void checkField(Class<?> targetClass, String fieldName, boolean isStatic) {
        try {
            Field field = targetClass.getDeclaredField(fieldName);
            boolean realIsStatic = Modifier.isStatic(field.getModifiers());
            if (realIsStatic == isStatic)
                System.out.println(" * " + (isStatic ? "Static" : "Instance") + " field '" + fieldName + "' exists.");
            else
                System.out.println(" * " + (isStatic ? "Static" : "Instance") + " field '" + fieldName + "' does not exist (found " + (realIsStatic ? "static" : "instance") + " field with same name).");
        } catch (NoSuchFieldException e) {
            System.out.println(" * " + (isStatic ? "Static" : "Instance") + " field '" + fieldName + "' does not exist.");
        }
    }

    private static void checkMethod(Class<?> targetClass, String methodName, boolean requireStatic, Class<?>[] paramTypes) {
        Method foundMethod = null;

        if (paramTypes.length > 0) {
            try {
                Method method = targetClass.getDeclaredMethod(methodName, paramTypes);
                if (Modifier.isStatic(method.getModifiers()) == requireStatic)
                    foundMethod = method;
            } catch (NoSuchMethodException ignored) {
            }
        } else
            for (Method method : targetClass.getDeclaredMethods()) {
                if (method.getName().equals(methodName) && (Modifier.isStatic(method.getModifiers()) == requireStatic)) {
                    foundMethod = method;
                    break;
                }
            }

        if (foundMethod != null)
            System.out.println(" * " + (requireStatic ? "Static" : "Instance") + " method '" + targetClass + "#" + methodName + "(" + formatParamTypes(foundMethod.getParameterTypes()) + ")' exists.");
        else
            System.out.println(" * " + (requireStatic ? "Static" : "Instance") + " method '" + targetClass + "#" + methodName + "(" + formatParamTypes(paramTypes) + ")' does not exist.");
    }

    private static List<Field> findFields(Class<?> parentClass, Class<?> targetType, boolean requireStatic) {
        List<Field> foundFields = new ArrayList<>();
        for (Field field : parentClass.getDeclaredFields())
            if (Modifier.isStatic(field.getModifiers()) == requireStatic && targetType.isAssignableFrom(field.getType()))
                foundFields.add(field);

        return foundFields;
    }

    private static List<Method> findMethods(Class<?> parentClass, Class<?> targetType, boolean requireStatic, Set<Class<?>> paramTypes) {
        List<Method> foundMethods = new ArrayList<>();
        for (Method method : parentClass.getDeclaredMethods())
            if (Modifier.isStatic(method.getModifiers()) == requireStatic) {
                boolean returnTypeMatches = targetType.isAssignableFrom(method.getReturnType());
                boolean paramTypesMatch = true;
                if (!paramTypes.isEmpty()) {
                    for (Class<?> actualParamType : method.getParameterTypes()) {
                        boolean foundMatchForActualParam = false;
                        for (Class<?> possibleType : paramTypes) {
                            if (possibleType.isAssignableFrom(actualParamType)) {
                                foundMatchForActualParam = true;
                                break;
                            }
                        }
                        if (!foundMatchForActualParam) {
                            paramTypesMatch = false;
                            break;
                        }
                    }
                }
                if (returnTypeMatches && paramTypesMatch)
                    foundMethods.add(method);
            }
        return foundMethods;
    }

    private static Optional<Class<?>> getClass(String className) {
        try {
            switch (className) {
                case "boolean":
                case "Boolean":
                    return Optional.of(boolean.class);
                case "byte":
                case "Byte":
                    return Optional.of(byte.class);
                case "short":
                case "Short":
                    return Optional.of(short.class);
                case "int":
                case "Int":
                    return Optional.of(int.class);
                case "long":
                case "Long":
                    return Optional.of(long.class);
                case "float":
                case "Float":
                    return Optional.of(float.class);
                case "double":
                case "Double":
                    return Optional.of(double.class);
                case "char":
                case "Char":
                    return Optional.of(char.class);
                case "string":
                case "String":
                    return Optional.of(String.class);
                case "void":
                case "Void":
                    return Optional.of(void.class);
                default:
                    return Optional.of(Class.forName(className));
            }
        } catch (ClassNotFoundException exception) {
            return Optional.empty();
        }
    }

    private static String formatParamTypes(Class<?>[] paramTypes) {
        if (paramTypes.length == 0) return "()";
        return "(" + Arrays.stream(paramTypes).map(Class::getName).reduce("", (prev, name) -> prev.isEmpty() ?name:  prev + ", " + name) + ")";
    }
}