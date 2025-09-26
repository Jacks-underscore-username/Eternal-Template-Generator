export {}
declare global {
  interface ObjectConstructor {
    entries<T extends object>(o: T): { [key in keyof T as string]: [key, T[key]] }[string][]

    fromEntries<T extends [PropertyKey, any][]>(entries: T): { [key in T[number][0]]: T[number][1] }
  }
}
