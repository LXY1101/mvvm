//订阅：往数组里面添加函数；发布：以此执行数组的函数
//发布订阅模式：先订阅 再发布
//绑定的方法 都有一个update属性
function Dep(){
    this.subs = []
}
Dep.prototype.addSub = function (sub) {//订阅
    this.subs.push(sub);
};
Dep.prototype.notify = function () {
    this.subs.forEach(sub=>sub.update());
};

function Watcher(fn){
    this.fn = fn;
}
Watcher.prototype.update = function(){
    this.fn();
};
let watcher = new Watcher(function () {//监听函数
    console.log(1);
});
let dep = new Dep();
dep.addSub(watcher);//将watcher放到数组里
dep.addSub(watcher);
dep.notify();//原理; 数组关系
