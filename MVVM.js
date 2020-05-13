function Fun(options = {}) { // MVVM框架核心类
    this.$options = options;
    let data = this._data = this.$options.data;

    observe(data); // 对data进行数据劫持

    for (let key in data) { // 将数据代理到this中，在this中对this._data操作
        Object.defineProperty(this, key, {
            enumerable: true,
            get () {
                return this._data[key];
            },
            set (newVal) {
                this._data[key] = newVal;
            }
        })
    }
    new Compile(options.el, this) // 编译页面
}

function Observe(data) { // 这里写逻辑，方便递归
    let dep = new Dep();
    for (let key in data) { // 把data上的属性通过defineProperty定义
        let val = data[key];
        observe(val);// 递归
        Object.defineProperty(data, key, {
            enumerable: true,
            get () { // 获取该属性
                Dep.target && dep.addSub(Dep.target); // 订阅
                return val
            },
            set (newVal) { // 更改这个属性
                if (val === newVal) return; // 值不改变
                val = newVal;
                observe(newVal);
                dep.notify()
            }
        })
    }
}


function observe(data) { // 给对象增加 Object.defineProperty
    if(typeof data != "object") return;
    return new Observe(data)
}

function Compile (el, vm) {
    vm.$el = document.querySelector(el); // 获取到dom容器

    // 新建一个文档碎片，将容器中的dom放入到文档碎片中（内存中），操作文档碎片编译（高效）
    let fragment = document.createDocumentFragment();
    while(child === vm.$el.firstChild) {
        fragment.appendChild(child)
    }
    replace(fragment);
    function replace (fragment) {
        Array.from(fragment.childNodes).forEach(node => {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;
            if (node.nodeType === 3 && reg.test(text)) { // 文本替换和添加订阅
                // 处理模板 文本节点
                let arr = RegExp.$1.split(".");
                let val = vm;
                arr.forEach(key => { // 取到符合条件的值，这样便于取到嵌套值 {{a.a}}
                    val = val[key]
                });
                new Watcher(vm, RegExp.$1, function (newVal) {
                    node.textContent = text.replace(reg, newVal) // 替换页面
                });
                node.textContent = text.replace(reg, val)
            }
            if (node.nodeType === 1) { // 元素节点，获取属性，处理指令
                let nodeAttrs = node.attributes; // 获取dom属性
                Array.from(nodeAttrs).forEach((attr) => {
                    let name = attr.name;//属性名
                    let exp = attr.value;//属性值
                    if (name.indexOf("v-") === 0) { // 这是指令 这里默认认为是 v-model
                        node.value = vm[exp]
                    }
                    new Watcher(vm, exp, function (newVal) {
                        node.value = newVal
                    });
                    // 添加输入事件监听
                    node.addEventListener("input", function (e) {
                        let newVal = e.target.value;
                        vm[exp] = newVal;//触发set方法
                    })
                })
            }
            if (node.childNodes) {
                replace(node)
            }
        })
    }

    vm.$el.appendChild(fragment)
}

// 发布订阅模式
function Dep () {
    this.subs = []
}
Dep.prototype.addSub = function (sub) {
    this.subs.push(sub)
};
Dep.prototype.notify = function () {
    this.subs.forEach(sub => {sub.update()})
};

function Watcher (vm, exp, fn) {
    this.fn = fn;
    this.vm = vm;
    this.exp = exp;
    Dep.target = this;

    // 在这里做一个取值操作，触发get函数，就会触发订阅
    let val = vm;
    let arr = exp.split(".");
    arr.forEach(key => {
        val = val[key]
    });
    Dep.target = null
}
Watcher.prototype.update = function (newVal) {
    let val = this.vm;

    let arr = this.exp.split(".");
    arr.forEach(key => {
        val = val[key]
    });
    this.fn(val)
}
