import { lazy, ComponentType, LazyExoticComponent } from "react";

export type LazyComponentWithPreload<T extends ComponentType<any> = ComponentType<any>> =
  LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> };

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyComponentWithPreload<T> {
  const Component = lazy(factory) as LazyComponentWithPreload<T>;
  Component.preload = factory;
  return Component;
}

export default lazyWithPreload;
