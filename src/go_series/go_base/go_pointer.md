---
title: 11. Go语言指针
category:
  - Go语言
tag:
  - Go语言
  - golang
  - go基础语法
  - 指针
---

# **Go语言指针**

## **指针是什么**

像c语言一样，Go语言也有指针的概念。简单理解，指针就是地址，指针变量就是存放地址的变量。在一个变量前加上*，那么这个变量就是指针变量，指针变量只能存放地址。
1个指针变量可以指向任何一个值的内存地址，它所指向的值的内存地址在32和64位机器上分别占用4或8个字节，占用字节的大小与所指向的值的大小无关。

## **创建指针**

### **声明指针**
我们可以像声明其它类型的变量一样，声明一个指针变量
```go
var a *int   
```
上述方法声明了一个整形指针变量a，但是该变量还没有存放任何地址，操作系统并未为其指向的内容分配内存，即该指针没有指向任何内容，所以它是一个空指针。
```go
var b int = 3 
a = &b  
```
此时a不再是一个空指针，a指向一个整形变量，该变量的值是3。
要获取指针变量所指向的内容，很简单，在变量前加*即可
```go
package main

import "fmt"

func main() {
   var a *int   
   fmt.Printf("赋值前a: %v\n", a)
   
   var b int = 3 
   a = &b                         // a存放的是b的地址
   fmt.Printf("赋值后a: %v\n", a)  // 打印出b的地址
   fmt.Printf("a指向的内容是: %v\n", *a)  // *a表示a存放的地址对应的内存存放的内容，这里为整数3
}
```
运行结果：
```
赋值前a: <nil>
赋值后a: 0x14000018000
a指向的内容是: 3
``` 

### **new()函数**
Go语言还提供了另外一种方法来创建指针变量，使用`new`函数创建
```go
new(type)
```
代码展示：
```go
package main

import "fmt"

func main() {
   s := new(string)
   fmt.Printf("赋值前s: %v\n", s)
   fmt.Printf("赋值前s的内容: %v\n", *s)
   
   *s = "Golang学习之路"
   fmt.Printf("赋值h后s: %v\n", s)
   fmt.Printf("赋值后s的内容: %v\n", *s)
}   
```
运行结果：
```
赋值前s: <nil>
赋值前s的内容: 
赋值后s: 0x14000018000
赋值后s的内容: Golang学习之路
```
可以看到，通过new函数创建指针的时候，系统会为其分配内存，所以两次都能打印出地址，但是，在没有对其赋值的时候，系统会存放默认值，string类型的就是空字符串""。

<div style="background-color: #f0f9eb; padding: 10px 15px; border-radius: 4px; border-left: 5px solid #67c23a; margin: 20px 0; color:rgb(64, 147, 255);">

<h1><span style="color: #006400;"><strong>关注秀才公众号：</strong></span><span style="color: red;"><strong>IT杨秀才</strong></span><span style="color: #006400;"><strong>，领取精品学习资料</strong></span></h1>

<div style="color: #333; font-family: 'Microsoft YaHei', Arial, sans-serif; font-size: 14px;">
<ul>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">Go面试</span><span style="color: #006400;">，领取Go面试题库PDF</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">Go学习</span><span style="color: #006400;">，领取Go必看书籍</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">大模型</span><span style="color: #006400;">，领取大模型学习资料</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">111</span><span style="color: #006400;">，领取架构学习资料</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">26届秋招</span><span style="color: #006400;">，领取26届秋招企业汇总表</span></strong></li>
</ul>
</div>

![](/assets/icon/avatar.png)

</div> 


