class Pool {
  constructor(factory) {
    this.factory = factory;
    this.pool = [];
  }

  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.factory();
  }

  release(obj) {
    this.pool.push(obj);
  }
}

window.Pool = Pool;
