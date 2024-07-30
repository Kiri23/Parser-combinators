class MenuItem {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  display() {
    return `${this.name}: $${this.price}`;
  }
}

class MenuCategory {
  constructor(name) {
    this.name = name;
    this.items = [];
  }

  add(item) {
    this.items.push(item);
    return this; // Permite encadenamiento
  }

  display() {
    return `${this.name}:\n${this.items
      .map((item) => "  " + item.display())
      .join("\n")}`;
  }
}

class Menu {
  constructor() {
    this.categories = [];
  }

  addCategory(category) {
    this.categories.push(category);
    return this; // Permite encadenamiento
  }

  display() {
    return this.categories.map((category) => category.display()).join("\n\n");
  }
}

// Construcción del menú
const menu = new Menu()
  .addCategory(
    new MenuCategory("Entradas")
      .add(new MenuItem("Ensalada", 5.99))
      .add(new MenuItem("Sopa", 4.99))
  )
  .addCategory(
    new MenuCategory("Platos Principales")
      .add(new MenuItem("Pasta", 12.99))
      .add(new MenuItem("Filete", 18.99))
  );

// Mostrar el menú
console.log(menu.display());
console.log("\n version 2: ");

class MenuItem2 {
  constructor(name, price, transform = (x) => x) {
    this.name = name;
    this.price = price;
    this.transform = transform;
  }

  display() {
    return this.transform(`${this.name}: $${this.price}`);
  }

  map(fn) {
    return new MenuItem2(this.name, this.price, (x) => fn(this.transform(x)));
  }
}

class MenuCategory2 {
  constructor(name, items = []) {
    this.name = name;
    this.items = items;
  }

  add(item) {
    this.items.push(item);
    return this;
  }

  display() {
    return `${this.name}:\n${this.items
      .map((item) => "  " + item.display())
      .join("\n")}`;
  }

  map(fn) {
    return new MenuCategory2(
      this.name,
      this.items.map((item) => item.map(fn))
    );
  }
}

// Uso
const pastaItem = new MenuItem2("Pasta", 12.99)
  .map((str) => str.toUpperCase())
  .map((str) => str + " (Especial del día)");

const mainCourse = new MenuCategory2("Platos Principales")
  .add(pastaItem)
  .add(new MenuItem2("Filete", 18.99))
  .map((str) => "** " + str + " **");

console.log(mainCourse.display());
