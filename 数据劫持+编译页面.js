function Fun(options = {}){
    this.$options = options;//将所有属性挂载到fun
    //this._data
    var data = this._data = this.$options.data;
    observe(data);
    //数据代理--> this代理了this._data;
    for(let key in data){
       Object.defineProperty(this,key,{
           enumerable:true,
           get(){
               return this._data[key];
           },
           set(newVal){
               this._data[key]=newVal
           }
       })
    }
    new Complie(options.el,this);
}
function Complie(el,vm){
    //el 表示替换的范围
    vm.$el=document.querySelector(el);
    let fragment = document.createDocumentFragment();
    while (child === vm.$el.firstChild){//将app中的内容移入到内存中
        fragment.appendChild(child);
    }
    replace(fragment);
    function replace(fragment) {
        Array.from(fragment.childNodes).forEach(function (node) {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;
            if(node.nodeType === 3 && reg.test(text)){
                console.log(RegExp.$1);//a.a vm.b
                let arr = RegExp.$1.split('.');//[a,a] [b]
                let val = vm;
                arr.forEach(function (k) {
                    val = val[k];
                });
                node.textContent = text.replace(/\{\{(.*)\}\}/,val);
            }
            if(node.childNodes){
                replace(node);
            }
        })
    }
    vm.$el.appendChild(fragment);
}

//vm.$options
//观察对象给对象ObjectDefineProperty
function Observe(data){
    for(let key in data){
        let val = data[key];
        Object.defineProperty(data,key,{
            enumerable:true,
            get(){
                return val;
            },
            set(newVal){
                if(newVal===val){
                    return;
                }
                val = newVal;
                observe(newVal);//深度响应,每一次新建一个对象,都会去数据劫持
            }
        })
    }
}
function observe(data){
    if(typeof data !== 'Object') return;
    return new Observe(data);
}


