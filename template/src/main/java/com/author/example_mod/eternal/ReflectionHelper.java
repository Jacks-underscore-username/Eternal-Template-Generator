package com.author.example_mod.eternal;

import org.apache.commons.lang3.tuple.Pair;

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

    private static final List<String> results = new ArrayList<>();
    private static final List<String> errors = new ArrayList<>();

    public static void main(String[] rawArgs) {
        try {
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
                        Pair<Optional<Class<?>>, String> parentClass = getClass(arg.getString());
                        if (parentClass.getLeft().isPresent()) results.add(" * Class " + arg.getString() + " exists.");
                        else results.add(" * Class " + arg.getString() + " does not exist.");
                    }
                }
                /*
                 * CHECK ElementType class [element]
                 * CHECK <ElementType extends method> class [element] (inputs: [class])
                 */
                else {
                    Pair<Optional<Class<?>>, String> parentClass = getClass(args.at(2).getString());
                    List<Pair<Optional<Class<?>>, String>> paramTypes = new ArrayList<>();
                    for (Arg className : args.atOr(4, new ArgList()).asList())
                        paramTypes.add(getClass(className.getString()));

                    for (Arg arg : args.at(3).asList()) {
                        if (elementType.equals(ElementType.INSTANCE_FIELD) || elementType.equals(ElementType.STATIC_FIELD))
                            checkField(parentClass, arg.getString(), elementType.equals(ElementType.STATIC_FIELD));
                        else if (elementType.equals(ElementType.INSTANCE_METHOD) || elementType.equals(ElementType.STATIC_METHOD))
                            checkMethod(parentClass, arg.getString(), elementType.equals(ElementType.STATIC_METHOD), paramTypes.toArray(new Class<?>[0]));
                        else
                            results.add(" * Class " + arg.getString() + (getClass(arg.getString()).getLeft().isPresent() ? " exists." : " does not exist."));
                    }
                }
            }
            /*
             * FIND [FindType] parent: [class] target: [class] (inputs: [class])
             */
            else {
                List<FindType> findTypes = args.at(1).asList().stream()
                        .map(arg -> FindType.valueOf(arg.getString())).collect(Collectors.toList());

                List<Pair<Optional<Class<?>>, String>> parentClasses = new ArrayList<>();
                for (Arg className : args.at(2).asList())
                    parentClasses.add(getClass(className.getString()));

                List<Pair<Optional<Class<?>>, String>> targetTypes = new ArrayList<>();
                for (Arg className : args.at(3).asList())
                    targetTypes.add(getClass(className.getString()));

                Set<Pair<Optional<Class<?>>, String>> validParamTypes = new HashSet<>();
                for (Arg className : args.atOr(4, new ArgList()).asList())
                    validParamTypes.add(getClass(className.getString()));

                for (FindType findType : findTypes)
                    for (Pair<Optional<Class<?>>, String> parentClass : parentClasses)
                        for (Pair<Optional<Class<?>>, String> targetType : targetTypes)
                            switch (findType) {
                                case INSTANCE_FIELD:
                                    findFields(parentClass, targetType, false).forEach(field ->
                                            results.add(" * Found instance field: " + parentClass.getLeft().get().getName() + "#" + field.getName() + " (Type: " + field.getType().getName() + ")")
                                    );
                                    break;
                                case STATIC_FIELD:
                                    findFields(parentClass, targetType, true).forEach(field ->
                                            results.add(" * Found static field: " + parentClass.getLeft().get().getName() + "#" + field.getName() + " (Type: " + field.getType().getName() + ")")
                                    );
                                    break;
                                case INSTANCE_METHOD:
                                    findMethods(parentClass, targetType, false, validParamTypes).forEach(method ->
                                            results.add(" * Found instance method: " + parentClass.getLeft().get().getName() + "#" + method.getName() + formatParamTypes(method.getParameterTypes()) + " -> " + method.getReturnType().getName())
                                    );
                                    break;
                                case STATIC_METHOD:
                                    findMethods(parentClass, targetType, true, validParamTypes).forEach(method ->
                                            results.add(" * Found static method: " + parentClass.getLeft().get().getName() + "#" + method.getName() + formatParamTypes(method.getParameterTypes()) + " -> " + method.getReturnType().getName())
                                    );
                                    break;
                            }
            }
        } catch (RuntimeException exception) {
            results.add(" * Failed with exception: " + exception.getMessage());
        }
        if (results.size() > 0)
            for (String result : results)
                System.out.println(result);
        else
            for (String error : errors)
                System.out.println(error);
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
            if (items.size() == 0) return "[]";
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

    private static void checkField(Pair<Optional<Class<?>>, String> maybeTargetClass, String fieldName, boolean isStatic) {
        try {
            if (!maybeTargetClass.getLeft().isPresent()) {
                errors.add(" * Cannot check for " + (isStatic ? "static" : "instance") + " field " + fieldName + ", cannot find parent class " + maybeTargetClass.getRight());
                return;
            }
            Class<?> targetClass = maybeTargetClass.getLeft().get();
            Field field = targetClass.getDeclaredField(fieldName);
            boolean realIsStatic = Modifier.isStatic(field.getModifiers());
            if (realIsStatic == isStatic)
                results.add(" * " + (isStatic ? "Static" : "Instance") + " field '" + fieldName + "' exists.");
            else
                results.add(" * " + (isStatic ? "Static" : "Instance") + " field '" + fieldName + "' does not exist (found " + (realIsStatic ? "static" : "instance") + " field with same name).");
        } catch (NoSuchFieldException e) {
            results.add(" * " + (isStatic ? "Static" : "Instance") + " field '" + fieldName + "' does not exist.");
        }
    }

    private static void checkMethod(Pair<Optional<Class<?>>, String> maybeTargetClass, String methodName, boolean isStatic, Class<?>[] paramTypes) {
        Method foundMethod = null;

        if (!maybeTargetClass.getLeft().isPresent()) {
            errors.add(" * Cannot check for " + (isStatic ? "static" : "instance") + " method " + methodName + ", cannot find parent class " + maybeTargetClass.getRight());
            return;
        }

        Class<?> targetClass = maybeTargetClass.getLeft().get();

        if (paramTypes.length > 0) {
            try {
                Method method = targetClass.getDeclaredMethod(methodName, paramTypes);
                if (Modifier.isStatic(method.getModifiers()) == isStatic)
                    foundMethod = method;
            } catch (NoSuchMethodException ignored) {
            }
        } else
            for (Method method : targetClass.getDeclaredMethods()) {
                if (method.getName().equals(methodName) && (Modifier.isStatic(method.getModifiers()) == isStatic)) {
                    foundMethod = method;
                    break;
                }
            }

        if (foundMethod != null)
            results.add(" * " + (isStatic ? "Static" : "Instance") + " method '" + targetClass + "#" + methodName + "(" + formatParamTypes(foundMethod.getParameterTypes()) + ")' exists.");
        else
            results.add(" * " + (isStatic ? "Static" : "Instance") + " method '" + targetClass + "#" + methodName + "(" + formatParamTypes(paramTypes) + ")' does not exist.");
    }

    private static List<Field> findFields(Pair<Optional<Class<?>>, String> maybeParentClass, Pair<Optional<Class<?>>, String> maybeTargetType, boolean isStatic) {
        if (!maybeParentClass.getLeft().isPresent()) {
            errors.add(" * Cannot find " + (isStatic ? "static" : "instance") + " fields, cannot find parent class " + maybeParentClass.getRight());
            return new ArrayList<>();
        }

        Class<?> parentClass = maybeParentClass.getLeft().get();

        if (!maybeTargetType.getLeft().isPresent()) {
            errors.add(" * Cannot find " + (isStatic ? "static" : "instance") + " fields in " + parentClass.getName() + ", cannot find target class " + maybeTargetType.getRight());
            return new ArrayList<>();
        }

        Class<?> targetType = maybeTargetType.getLeft().get();

        List<Field> foundFields = new ArrayList<>();
        for (Field field : parentClass.getDeclaredFields())
            if (Modifier.isStatic(field.getModifiers()) == isStatic && targetType.isAssignableFrom(field.getType()))
                foundFields.add(field);

        return foundFields;
    }

    private static List<Method> findMethods(Pair<Optional<Class<?>>, String> maybeParentClass, Pair<Optional<Class<?>>, String> maybeTargetType, boolean isStatic, Set<Pair<Optional<Class<?>>, String>> paramTypes) {
        if (!maybeParentClass.getLeft().isPresent()) {
            errors.add(" * Cannot find " + (isStatic ? "static" : "instance") + " methods, cannot find parent class " + maybeParentClass.getRight());
            return new ArrayList<>();
        }

        Class<?> parentClass = maybeParentClass.getLeft().get();

        if (!maybeTargetType.getLeft().isPresent()) {
            errors.add(" * Cannot find " + (isStatic ? "static" : "instance") + " methods in " + parentClass.getName() + ", cannot find target class " + maybeTargetType.getRight());
            return new ArrayList<>();
        }

        Class<?> targetType = maybeTargetType.getLeft().get();

        List<Method> foundMethods = new ArrayList<>();
        for (Method method : parentClass.getDeclaredMethods())
            if (Modifier.isStatic(method.getModifiers()) == isStatic) {
                boolean returnTypeMatches = targetType.isAssignableFrom(method.getReturnType());
                boolean paramTypesMatch = true;
                if (paramTypes.size() > 0) {
                    for (Class<?> actualParamType : method.getParameterTypes()) {
                        boolean foundMatchForActualParam = false;
                        for (Pair<Optional<Class<?>>, String> possibleType : paramTypes) {
                            if (possibleType.getLeft().isPresent() && possibleType.getLeft().get().isAssignableFrom(actualParamType)) {
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

    private static Pair<Optional<Class<?>>, String> getClass(String className) {
        try {
            switch (className) {
                case "boolean":
                case "Boolean":
                    return Pair.of(Optional.of(boolean.class), className);
                case "byte":
                case "Byte":
                    return Pair.of(Optional.of(byte.class), className);
                case "short":
                case "Short":
                    return Pair.of(Optional.of(short.class), className);
                case "int":
                case "Int":
                    return Pair.of(Optional.of(int.class), className);
                case "long":
                case "Long":
                    return Pair.of(Optional.of(long.class), className);
                case "float":
                case "Float":
                    return Pair.of(Optional.of(float.class), className);
                case "double":
                case "Double":
                    return Pair.of(Optional.of(double.class), className);
                case "char":
                case "Char":
                    return Pair.of(Optional.of(char.class), className);
                case "string":
                case "String":
                    return Pair.of(Optional.of(String.class), className);
                case "void":
                case "Void":
                    return Pair.of(Optional.of(void.class), className);
                default:
                    return Pair.of(Optional.of(Class.forName(className, false, ReflectionHelper.class.getClassLoader())), className);
            }
        } catch (ClassNotFoundException exception) {
            if (className.contains(".")) {
                String firstPart = className.substring(0, className.lastIndexOf("."));
                String secondPart = className.substring(className.lastIndexOf(".") + 1);
                Pair<Optional<Class<?>>, String> parentClass = getClass(firstPart);
                if (parentClass.getLeft().isPresent()) {
                    Class<?>[] parentClasses = parentClass.getLeft().get().getDeclaredClasses();
                    for (Class<?> clazz : parentClasses)
                        if (clazz.getName().equals(firstPart + "$" + secondPart))
                            return Pair.of(Optional.of(clazz), className);
                }
            }
            return Pair.of(Optional.empty(), className);
        }
    }

    private static String formatParamTypes(Class<?>[] paramTypes) {
        if (paramTypes.length == 0) return "()";
        return "(" + Arrays.stream(paramTypes).map(Class::getName).reduce("", (prev, name) -> prev.length() == 0 ? name : prev + ", " + name) + ")";
    }
}