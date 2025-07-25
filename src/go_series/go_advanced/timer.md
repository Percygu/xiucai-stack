---
title: 7. 定时器
category:
  - Go语言
tag:
  - Go语言
  - golang
  - go进阶
  - 定时器
  - 并发
---

# **定时器**
在我们项目中，常常会有这样的场景，比如到了未来某一时刻，需要某个逻辑或者某个任务执行一次，或者是周期性的的执行多次，有点类似定时任务。这种场景就需要用到定时器，Go语言中也内置了定时器的实现，`timer`和`ticker`。

## **Timer**
`Timer`是一种一次性时间定时器，即在未来某个时刻，触发的事件只会执行一次。

### **Timer的结构定义**
```go
type Timer struct {
    C <-chan Time
    r runtimeTimer
}
```
`Timer`结构里有一个`Time`类型的管道`C`，主要用于事件通知。在未到达设定时间的时候，管道内没有数据写入，一直处于阻塞状态，到达设定时间后，会向管道内写入一个系统时间，触发事件。

### **创建Timer**
```go
func NewTimer(d Duration) *Timer
```
使用示例：
```go
package main

import (
   "fmt"
   "time"
)

func main() {
   timer := time.NewTimer(2 * time.Second) //设置超时时间2s
   <-timer.C
   fmt.Println("after 2s Time out!")
}
```
运行结果：
```
after 2s Time out!
```
程序在`2s`后打印`"after 2s Time out!"`，因为创建了一个定时器`timer`，设置了超时时间为`2s`，执行`<-timer.C`会一直阻塞，直到`2s`后，程序继续执行。

### **停止Timer**
```go
func (t *Timer) Stop() bool
```
返回值：
- `true`：执行`stop()`时`timer`还没有到达超时时间，即超时时间内停止了`timer`
- `false`：执行`stop()`时`timer`到达了超时时间，过了超时时间才停止`timer`

使用示例：
```go
package main

import (
   "fmt"
   "time"
)

func main()  {
    timer := time.NewTimer(2 * time.Second) //设置超时时间2s
    res := timer.Stop()
    fmt.Println(res)
}
```
运行结果:
```
true
```

### **重置Timer**

```go
func (t *Timer) Reset(d Duration) bool
```

对于已经过期或者是已经停止的`timer`，可以通过重置方法激活使其继续生效。
使用示例：
```go
package main

import (
   "fmt"
   "time"
)

func main() {
   timer := time.NewTimer(time.Second * 2)

   <-timer.C
   fmt.Println("time out1")

   res1 := timer.Stop()
   fmt.Printf("res1 is %t\n", res1)

   timer.Reset(time.Second * 3)

   res2 := timer.Stop()
   fmt.Printf("res2 is %t\n", res2)
}
```
运行结果：
```
time out1
res1 is false
res2 is true 
```
程序2s之后打印"time out1"，此时`timer`已经过期了，所以`res1`的值为`false`，接下来执行`timer.Reset(time.Second * 3)`又使`timer`生效了，并且重设超时时间为3s，但是紧接着执行了`timer.Stop()`，还未到超时时间，所以`res2`的值为`true`。

### **time.AfterFunc**
方法定义：
```go
func AfterFunc(d Duration, f func()) *Timer
```
`time.AfterFunc`参数为超时时间`d`和一个具体的函数`f`，返回一个`Timer`的指针，作用在创建出`timer`之后，在当前`goroutine`，等待一段时间`d`之后，将执行`f`。
使用示例：
```go
package main

import (
   "fmt"
   "time"
)

func main() {
   duration := time.Duration(1) * time.Second

   f := func() {
      fmt.Println("f has been called after 1s by time.AfterFunc")
   }

   timer := time.AfterFunc(duration, f)
   defer timer.Stop()

   time.Sleep(2 * time.Second)
}
```
运行结果：
```
f has been called after 1s by time.AfterFunc
```
1s之后打印语句。

### **time.After**
方法定义：
```go
func After(d Duration) <-chan Time {
    return NewTimer(d).C
}
```
根据函数定义可以看到，`after`函数会返回`timer`里的管道，并且这个管道会在经过时段`d`之后写入数据，调用这个函数，就相当于实现了定时器。一般`time.After`会配合`select`一起使用，使用示例如下：

```go
package main

import (
   "fmt"
   "time"
)

func main() {
   ch := make(chan string)

   go func() {
      time.Sleep(time.Second * 3)
      ch <- "test"
   }()

   select {
   case val := <-ch:
      fmt.Printf("val is %s\n", val)
   case <-time.After(time.Second * 2):
      fmt.Println("timeout!!!")
   }
}
```
运行结果：
```
timeout!!!
```
程序创建了一个管道`ch`，并且在主`goroutine`用`select`监听两个管道，一个是刚刚创建的`ch`，一个是`time.After`函数返回的管道`c`，`ch`管道3s之后才会有数据写入，而`time.After`函数是2s超时，所以2s后就会有数据写入，这样`select`会先收到管道`c`里的数据，执行`timeout`退出。

## **Ticker**

### **Ticker创建**
方法定义如下：
```go
func NewTicker(d Duration) *Ticker
```
`NewTicker`用于返回一个`Ticker`对象。

### **Ticker对象定义**
```go
type Ticker struct {
   C <-chan Time // The channel on which the ticks are delivered.
   r runtimeTimer
}
```
`Ticker`对象的字段和`Timer`是一样的，也包含一个通道字段，并会每隔时间段`d`就向该通道发送当时的时间，根据这个管道消息来触发事件，但是`ticker`只要定义完成，就从当前时间开始计时，每隔固定时间都会触发，只有关闭`Ticker`对象才不会继续发送时间消息。
使用示例：
```go
package main

import (
   "fmt"
   "time"
)

func Watch() chan struct{} {
   ticker := time.NewTicker(1 * time.Second)

   ch := make(chan struct{})
   go func(ticker *time.Ticker) {
      defer ticker.Stop()
      for {
         select {
         case <-ticker.C:
            fmt.Println("watch!!!")
         case <-ch:
            fmt.Println("Ticker Stop!!!")
            return
         }
      }
   }(ticker)
   return ch
}

func main() {
   ch := Watch()
   time.Sleep(5 * time.Second)
   ch <- struct{}{}
   close(ch)
}
```
运行结果：
```
watch!!!
watch!!!
watch!!!
watch!!!
watch!!!
Ticker Stop!!!
```
`Watch`函数里创建一个`ticker`，将它传递到子`goroutine`函数，每隔1s打印"watch!!!"，主函数创建一个管道`ch`，通过`ch`来控制`go func()`函数的退出，在5s之后主函数发送一个信号到`ch`，`watch`函数`select`收到`ch`信号，将`return`，在`return`之前将执行`defer ticker.Stop()`语句关闭`ticker`。在这5s之间，`select`将每个1s收到`ticker.C`管道里的消息，打印"watch!!!"。

> 注意：调用`ticker.Stop()`只会停止`ticker`，但并不会关闭`ticker.C`这个管道，所以我们需要用这个`channel`来控制`watch`函数中的`goroutine`能够退出。