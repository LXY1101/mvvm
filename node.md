1.数据劫持: 使用 Object.defineProperty(obj, 'property',{})来定义属性，在定义时传入一些参数，包括set()和get()函数，分别在设置和获取该对象的该属性时调用执行。

function MVVM(option = {}) {
    this.$option = option
    let data = this._data = this.$option.data

    // 对data进行数据劫持
    observe(data)

    // 将数据代理到this中，在this中对this._data操作
    for (let key in data) {
        Object.defineProperty(this, key, {
            enumerable: true,
            get () {
                return this._data[key]
            },
            set (newVal) {
                this._data[key] = newVal
            }
        })
    }
}

function Observe(data) { // 这里写逻辑，方便递归
    for (let key in data) { // 把data上的属性通过defineProperty定义 
        let val = data[key]
        observe(val) // 递归
        Object.defineProperty(data, key, {
            enumerable: true,
            get () { // 获取该属性
                return val
            },
            set (newVal) { // 更改这个属性
                if (val === newVal) return // 值不改变
                val = newVal 
                observe(newVal)
            } 
        })
    }
}


// 给对象增加 Object.defineProperty 
function observe(data) {
    if(typeof data != "object") return
    return new Observe(data)
}
从代码看出，this代理了this._data(被劫持的数据)，所以我们在用this.未定义属性时不会加上setter和getter，应该去报错

2.编译页面

function VM(options = {}) { // MVVM框架核心类
    this.$options = options
    let data = this._data = this.$options.data

    
    observe(data) // 对data进行数据劫持

    for (let key in data) { // 将数据代理到this中，在this中对this._data操作
        Object.defineProperty(this, key, {
            enumerable: true,
            get () {
                return this._data[key]
            },
            set (newVal) {
                this._data[key] = newVal
            }
        })
    }

    new Compile(options.el, this) // 编译页面
}

function Observe(data) { // 这里写逻辑，方便递归
    for (let key in data) { // 把data上的属性通过defineProperty定义 
        let val = data[key]
        observe(val) // 递归
        Object.defineProperty(data, key, {
            enumerable: true,
            get () { // 获取该属性
                return val
            },
            set (newVal) { // 更改这个属性
                if (val === newVal) return // 值不改变
                val = newVal 
                observe(newVal)
            } 
        })
    }
}


function observe(data) { // 给对象增加 Object.defineProperty 
    if(typeof data != "object") return
    return new Observe(data)
}

function Compile (el, vm) {
    vm.$el = document.querySelector(el) // 获取到dom容器

    // 新建一个文档碎片，将容器中的dom放入到文档碎片中（内存中），操作文档碎片编译（高效）
    let fragment = document.createDocumentFragment() 
    while(child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }
    replace(fragment)
    function replace (fragment) {
        Array.from(fragment.childNodes).forEach(node => {
            let text = node.textContent
            let reg = /\{\{(.*)\}\}/
            if (node.nodeType === 3 && reg.test(text)) {
                // 处理模板 文本节点
                let arr = RegExp.$1.split(".") 
                let val = vm
                arr.forEach(key => { // 取到符合条件的值，这样便于取到嵌套值 {{a.a}} 
                    val = val[key]
                })
                node.textContent = text.replace(reg, val)
            }
            if (node.childNodes) {
                replace(node)
            }
        })
    }
    
    vm.$el.appendChild(fragment)
}
在实例化VM时，还要去编译页面，这里通过递归获取到指定容器中的{{ data }}写法的文本节点，通过正则匹配到其中的 data，再根据传入的vm实例中的data替换文本节点

3.发布订阅模式 + 数据劫持实现 vm

function VM(options = {}) { // MVVM框架核心类
    this.$options = options
    let data = this._data = this.$options.data

    
    observe(data) // 对data进行数据劫持

    for (let key in data) { // 将数据代理到this中，在this中对this._data操作
        Object.defineProperty(this, key, {
            enumerable: true,
            get () {
                return this._data[key]
            },
            set (newVal) {
                this._data[key] = newVal
            }
        })
    }

    new Compile(options.el, this) // 编译页面
}

function Observe(data) { // 这里写逻辑，方便递归
    let dep = new Dep()
    for (let key in data) { // 把data上的属性通过defineProperty定义 
        let val = data[key]
        observe(val) // 递归
        Object.defineProperty(data, key, {
            enumerable: true,
            get () { // 获取该属性
                Dep.target && dep.addSub(Dep.target) // 订阅
                return val
            },
            set (newVal) { // 更改这个属性
                if (val === newVal) return // 值不改变
                val = newVal 
                observe(newVal)
                dep.notify()
            } 
        })
    }
}


function observe(data) { // 给对象增加 Object.defineProperty 
    if(typeof data != "object") return
    return new Observe(data)
}

function Compile (el, vm) {
    vm.$el = document.querySelector(el) // 获取到dom容器

    // 新建一个文档碎片，将容器中的dom放入到文档碎片中（内存中），操作文档碎片编译（高效）
    let fragment = document.createDocumentFragment() 
    while(child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }
    replace(fragment)
    function replace (fragment) {
        Array.from(fragment.childNodes).forEach(node => {
            let text = node.textContent
            let reg = /\{\{(.*)\}\}/
            if (node.nodeType === 3 && reg.test(text)) {
                // 处理模板 文本节点
                let arr = RegExp.$1.split(".") 
                let val = vm
                arr.forEach(key => { // 取到符合条件的值，这样便于取到嵌套值 {{a.a}} 
                    val = val[key]
                })
                new Watcher(vm, RegExp.$1, function (newVal) {
                    node.textContent = text.replace(reg, newVal) // 替换页面
                })
                node.textContent = text.replace(reg, val)
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
}
Dep.prototype.notify = function () {
    this.subs.forEach(sub => {sub.update()})
}

function Watcher (vm, exp, fn) {
    this.fn = fn
    this.vm = vm
    this.exp = exp
    Dep.target = this

    // 在这里做一个取值操作，触发get函数，就会触发订阅
    let val = vm
    let arr = exp.split(".")
    arr.forEach(key => {
        val = val[key]
    })
    Dep.target = null
}
Watcher.prototype.update = function (newVal) {
    let val = this.vm 

    let arr = this.exp.split(".")
    arr.forEach(key => {
        val = val[key]
    })
    this.fn(val)
}
当我们在页面中编译一个data时，会创建一个watcher，此时传入了与这个数据相关的参数，在构造函数中根据这些参数获取这个数据，此时会触发它的get方法，在get中将watcher订阅到dep上，在set这个数据时执行dep.notify()会使得所有的watcher的update函数执行，此时在update函数中获取到set的新值，再调用实例化时传入的函数更新视图。

4.指令的实现 v-model

function Compile (el, vm) {
    vm.$el = document.querySelector(el) // 获取到dom容器

    // 新建一个文档碎片，将容器中的dom放入到文档碎片中（内存中），操作文档碎片编译（高效）
    let fragment = document.createDocumentFragment() 
    while(child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }
    replace(fragment)
    function replace (fragment) {
        Array.from(fragment.childNodes).forEach(node => {
            let text = node.textContent
            let reg = /\{\{(.*)\}\}/
            if (node.nodeType === 3 && reg.test(text)) { // 文本替换和添加订阅
                // 处理模板 文本节点
                let arr = RegExp.$1.split(".") 
                let val = vm
                arr.forEach(key => { // 取到符合条件的值，这样便于取到嵌套值 {{a.a}} 
                    val = val[key]
                })
                new Watcher(vm, RegExp.$1, function (newVal) {
                    node.textContent = text.replace(reg, newVal) // 替换页面
                })
                node.textContent = text.replace(reg, val)
            }
            if (node.nodeType === 1) { // 元素节点，获取属性，处理指令
                let nodeAttrs = node.attributes // 获取dom属性
                Array.from(nodeAttrs).forEach((attr) => {
                    let name = attr.name
                    let exp = attr.value
                    if (name.indexOf("v-") == 0) { // 这是指令 这里默认认为是 v-model
                        node.value = vm[exp]
                    }
                    new Watcher(vm, exp, function (newVal) {
                        node.value = newVal
                    })
                    // 添加输入事件监听
                    node.addEventListener("input", function (e) {
                        let newVal = e.target.value
                        vm[exp] = newVal 
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
在解析时，如果节点有v-属性说明是指令，双向数据绑定的逻辑处理要订阅数据，还需要在输入数据是去写数据触发set函数

