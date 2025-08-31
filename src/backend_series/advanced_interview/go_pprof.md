# 1. 环境准备
服务器环境：Linux  
CPU：2核  
内存：2G  
这个是最低的机器配置要求，接下来测试的问题程序会占用2G的内存，占用 CPU 最高约 100%

# 2. 运行程序
简单看一下程序的main.go文件，这里只简单看一下main.go文件这个文件就可以了，对于整个程序代码没有必要看，这样一来定位解决问题会显得更加的真实
```go
package main

import (
    "log"
    "net/http"
    _ "net/http/pprof" //// pprof包会注册 handler到http server，这样才可以通过http接口获取采样报告
    "os"
    "runtime"
    "time"

    "github.com/pprof-demo/animal"
)

func main() {
    log.SetFlags(log.Lshortfile | log.LstdFlags)
    log.SetOutput(os.Stdout)

    runtime.GOMAXPROCS(1)
    runtime.SetMutexProfileFraction(1)
    runtime.SetBlockProfileRate(1)

    go func() {
       if err := http.ListenAndServe(":6060", nil); err != nil {
          log.Fatal(err)
       }
       os.Exit(0)
    }()

    for {
       for _, v := range animal.AllAnimals {
          v.Live()
       }
       time.Sleep(time.Second)
    }
}
```
这程序中我们需要导入pprof整个包，注意只需要导入就可以了，它会自动注册handler到http server，所以前面用下划线忽略，不需要用到这个包下的变量或者方法。接下来通过一下命令来运行这个程序：
```go
go build
./pprof-demo
```
程序运行起来之后，会在控制台不停的打印如下日志

![](https://files.mdnice.com/user/75626/94752f62-5a2d-485e-9be2-d71b1304546e.PNG)

# 3. 使用 pprof
保持程序运行，打开浏览器访问[http://localhost:6060/debug/pprof/](http://localhost:6060/debug/pprof/)，可以看到如下页面

![](https://files.mdnice.com/user/75626/e65cbf4a-532a-4f07-a797-91f76b3ef946.png)

页面上显示的这些指标就是程序运行时pprof采集的数据，下表是对这些数据的解释
| 指标    | 描述    |  备注  |
| --- | --- | --- |
| allocs    | 内存分配信息    | 可以用浏览器直接点击打开    |
| blocks    | 阻塞操作信息    | 可以用浏览器直接点击打开    |
| cmdline    | 显示程序启动命令及参数    |  点击浏览器打开会下载文件   |
| goroutine    | 当前所有协程的堆栈信息    | 可以用浏览器直接点击打开    |
| heap    | 堆上内存使用信息    | 可以用浏览器直接点击打开    |
| mutex    | 锁竞争信息    |  可以用浏览器直接点击打开   | 
| profile    | CPU 占用信息    |  点击浏览器打开会下载文件   |
| threadcreate    | 系统线程创建信息    |  可以用浏览器直接点击打开   |
| trace    | 程序运行跟踪信息    |  点击浏览器打开会下载文件   |

`trace`是Go语言工具链中的另一大利器，这里不做过多赘述，后面会有专门的一篇文章来讲解`trace`定位Go程序性能问题。threadcreate所涉及到的问题较为复杂，通常定位性能问题也不太需要，所以这里也不过多阐述。另外， `cmdline`是程序的启动命令以及参数，对于定位性能问题没什么意义，这里也不过多赘述。除此之外的所有指标都是性能排查的重点，本文的排查案例中也都会有所涉及

## 3.1 cpu占用过高排查
保持程序正常运行，通过活动监视器(mac)或者资源监视器(windows)或者`top`命令(linux)，查看一下程序的cpu占用情况

![](https://files.mdnice.com/user/75626/21d65498-1387-4b2e-a812-6314d1014686.png)

通过活动监视器看到CPU占用相当高，这显然是不正常的，回顾上面的`pprof`指标信息`profile`是用来采集cpu占用信息的，所以可以先用`go tool pprof`来排查一下
```go
go tool pprof http://localhost:6060/debug/pprof/profile
```
执行完命令之后，等待一小会儿，会进入到一个交互式终端

![](https://files.mdnice.com/user/75626/1a31426c-bbff-4460-a6c6-de898eff09fb.png)

输入`top`命令，即可看到CPU 占用较高的调用情况

![](https://files.mdnice.com/user/75626/00d6a4ee-13ed-4687-89f5-ddb7c6d7a19d.png)

可以看到CPU占用最高的调用是`github.com/pprof-demo/animal/felidae/tiger.(*Tiger).Eat`方法，
这里各个指标的解释如下
| 字段    |  说明   |
| --- | --- |
| flat    |  当前函数占用 cpu 耗时   |
| flat %    | 当前函数占用 cpu 耗时百分比    |
| sum%    |  函数占用 cpu 时间累积占比，从小到大一直累积到 100%   |
| cum    | 当前函数加上调用当前函数的函数占用 cpu 的总耗时    |
| %cum    |  当前函数加上调用当前函数的函数占用 cpu 的总耗时占比   |

接着在交互式终端输入：`list Eat`，可以查看这个问题代码究竟在什么位置

![](https://files.mdnice.com/user/75626/16f7b26a-cef0-4bf2-8af2-71f329a3bd65.png)

很容易发现，在`tiger.go`文件的第`24`行有一个空循环，循环了一百亿次，占用了大量的CPU时间。这样就成功定位到了问题代码，然后根据对应的代码问题做修复即可   
以上是命令行形式的代码定位，一般情况下这样就可以定位到问题了。`ppro`还提供了一种更直观的图形化显示调用栈信息的方式，图形化方式需要借助graphviz工具来完成。以下是是三种平台graphviz工具的安装方式

MacOS
```shell
brew install graphviz
```
Ubuntu
```shell
apt install graphviz
```
Centos
```shell
yum install graphviz
```
除了命令行形式安装外，当然还可以访问[graphviz官网](https://blog.wolfogre.com/redirect/v3/A421Yoc_xEV4GG_UO8tV1nMSAwM8Cv46xcU7gjwSbQjbbjsviVpukMUYBkEJFgboxTESAwM8Cv46xcVaFgY7bkEGFtw7If3FPAZNCsU7Bsw8PAXMPIIcSojF)选择压缩包或者事安装包的形式来安装  
在完成graphviz的安装之后，我们就可以继续在上述的交互之终端输入`web`命令，这样就会生成一个后缀为`.svg` 的文件，并用你的默认浏览器打开它
如果没有安装则会出现以下提示

![](https://files.mdnice.com/user/75626/167cfe4f-45b0-4c14-858b-d0d5b75c8d0f.png)

然后按照上述方法安装成功后，再次输入`web`命令，就会自动跳转到浏览器上打开以下页面

![](https://files.mdnice.com/user/75626/494f6a1a-2b2a-4e7e-819a-c800895bd846.png)

可以看到图中，`tiger.(*Tiger).Eat`函数的框特别大，这里排查的是CPU的占用情况，所以框越大表示CPU占用越高，并且图中`tiger.(*Tiger).Eat`函数框还展示了具体的CPU占用时间和比例。这样我们就定位到了程序中具体的函数或方法调用，接下来就到程序中找到对应的发方法做对应修改即可  
接下来简单修复一下该代码，由于这里只是个demo演示，所以将这段空循环注释掉即可
```go
func (t *Tiger) Eat() {
    log.Println(t.Name(), "eat")
    //loop := 10000000000
    //for i := 0; i < loop; i++ {
    // // do nothing
    //}
}
```
然后在上面`go tool pprof`的交互式终端输入`exit`命令就可以退出交互式终端了

![](https://files.mdnice.com/user/75626/fc20cf5c-dbb0-429f-9997-118c06b3b02f.png)

在修复完CPU占用过高的问题代码后，重新编译程序，再次运行。通过活动监视器可以看到CPU指标已经降下去了

![](https://files.mdnice.com/user/75626/022444f3-4103-4bd2-b152-f5c6a10867ee.png)

## 3.2 内存占用过多排查
CPU问题解决之后，这里我们切换到内存指标，看一下内存的使用情况

![](https://files.mdnice.com/user/75626/639641a9-3182-4e85-93ae-eaacb76b4c57.png)

可以看到pprof-demo进程使用的内存还是挺高的，这个程序可能还存在内存使用不当的情况，接下来执行以下命令来排查一下内存使用情况
```go
go tool pprof http://localhost:6060/debug/pprof/heap
```
接下来同样使用`top`、`list`命令来定位问题代码，输入`top`命令后

![](https://files.mdnice.com/user/75626/9cebb6d6-2e19-4532-ace1-e7f37d8a4d4b.png)

可以看到`mouse.(*Mouse).Steal`出现了问题，接着执行`list Steal`命令，结果如下

![](https://files.mdnice.com/user/75626/13981f7f-0e16-453c-bd8d-93f48bd07d60.png)

从这里就可以详细的看出问题代码的位置，问题函数如下：
```go
func (m *Mouse) Steal() {
    log.Println(m.Name(), "steal")
    max := constant.Gi
    for len(m.buffer)*constant.Mi < max {
       m.buffer = append(m.buffer, [constant.Mi]byte{})
    }
}
```
在这个函数里有一个循环会一直向 `m.buffer`里追加长度为`1MB`的数组，直到总容量到达`1GB`为止，且一直不释放这些内存，这样很明显就导致内存占用过高了。  
同样的操作，在交互终端输入`web`命令，通过图形化展示来查看

![](https://files.mdnice.com/user/75626/a0fb7eff-1df0-4834-a7d2-dafbdbff472d.png)

确实可以发现`Steal`函数框很大，而且调用链的箭头很粗，问题确实是出在了这里。同样这里代码的修复，对错误代码做个注释
```go
func (m *Mouse) Steal() {
    log.Println(m.Name(), "steal")
    //max := constant.Gi
    //for len(m.buffer)*constant.Mi < max {
    // m.buffer = append(m.buffer, [constant.Mi]byte{})
    //}
}
```
重新编译运行，查看内存占用情况

![](https://files.mdnice.com/user/75626/750d616f-8df0-4228-9ed8-1adca5614aa0.png)

运行一会之后发现内存确实降到了`21.1M`，看起来内存占用过高问题已经定位到，并且有效解决了。但是内存问题真的已经全部解决了吗？

## 3.3 频繁GC排查
上面似乎看起来解决了内存问题，但是过一段时间之后，发现内存占用在不断增大，一段时间后甚至长到了`6G`左右

![](https://files.mdnice.com/user/75626/9d81993d-0d17-4a5a-9b92-7eac944043f4.png)

再过一会，查看活动监视器，内存又降到了4G多

![](https://files.mdnice.com/user/75626/8e68e92d-edbe-4514-98d6-e94bc80f8649.png)

说明短时间内有内存释放了，最有可能的情况就是短时间内发生了GC，解决了程序的内存问题。但是频繁的GC对Go程序性能的影响也是非常严重的。这个程序是不是存在频繁GC的情况呢？进一步验证  
为了获取程序的GC日志，需要在程序启动前加一个参数，我们停止正在运行的程序，执行以下命令重新启动，并且使用 `grep`筛选出GC日志查看
```go
GODEBUG=gctrace=1 ./pprof-demo | grep gc
```
可以看到控制台有如下日志输出

![](https://files.mdnice.com/user/75626/31646335-3192-4000-a2b9-52161addb7cf.png)

可以发现，差不多每3秒就会发生一次GC，每次GC都会从`16MB`清理到几乎`0MB`。GC发生的频率很高，程序存在不断的申请内存并释放的情况。这是一个性能好的Go程序所不能接受的。  
所以接下来需要使用`pprof`来排查频繁GC问题，具体的是需要看看程序是什么地方不断的申请内存。注意，内存的申请与释放频度是需要一段时间来统计的，所以在统计之前，请确保程序已经运行一段时间了，至少几分钟。接下来执行以下命令
```go
go tool pprof http://localhost:6060/debug/pprof/allocs
```
接下来同样是使用`top`、`list`、`web`命令来查看详细情况

![](https://files.mdnice.com/user/75626/4a411c1a-5938-4d6f-8ff6-58fca6f17f5c.png)

执行完`top`命令后，可以发现有两个地方有问题，第一个地方是`mouse.(*Mouse).Pee`方法里的一个子`goroutine`里的方法，另一个是`dog.(*Dog).Run`方法  
执行`list func1`和`list Run`命令，看看具体的代码位置和问题代码逻辑

![](https://files.mdnice.com/user/75626/fe3e77fc-ea6c-45d2-9c47-822c2c6af294.png)

mouse.(*Mouse).Pee:
```go
func (m *Mouse) Pee() {
    log.Println(m.Name(), "pee")
    go func() {
       time.Sleep(time.Second * 30) //
       max := constant.Gi
       for len(m.slowBuffer)*constant.Mi < max {
          m.slowBuffer = append(m.slowBuffer, [constant.Mi]byte{})
          time.Sleep(time.Millisecond * 500)
       }
    }()
}
````
在`mouse.(*Mouse).Pee`方法里开启了一个`go func()`方法，这个方法会每个`500毫秒`向`m.slowBuffer`里追加长度为`1MB`的数组，直到总容量到达`1GB`为止，所以这里会不断的增大内存。 

dog.(*Dog).Run:
```go
func (d *Dog) Run() {
    log.Println(d.Name(), "run")
    _ = make([]byte, 16*constant.Mi)
}
```
这个`Run`函数会被频繁调用创建`16MB`大小的byte切片。这个函数被频繁调用的话，就会导致频繁的内存申请。不过这里有一点需要注意，这个`Run`函数里，如果将`16 * constant.Mi`修改成一个较小的值，重新编译运行，会发现并不会引起频繁GC。因为在Go语言里，对象分配在堆上还是栈上，是由编译器进行逃逸分析并决定的，如果对象不会逃逸，便可在使用栈内存，这样就不会出现GC情况。所以这里设置申请`16MB`的内存就是为了避免编译器直接在栈上分配  
交互终端执行`web`命令，可视化查看

![](https://files.mdnice.com/user/75626/81370cf3-7de1-4b64-821d-00421ebe9140.png)



接下来同样注释掉问题代码，如下：
```go
func (m *Mouse) Pee() {
    log.Println(m.Name(), "pee")
    go func() {
       time.Sleep(time.Second * 30) //
       //max := constant.Gi
       //for len(m.slowBuffer)*constant.Mi < max {
       // m.slowBuffer = append(m.slowBuffer, [constant.Mi]byte{})
       // time.Sleep(time.Millisecond * 500)
       //}
    }()
}
```
```go
func (d *Dog) Run() {
    log.Println(d.Name(), "run")
    //_ = make([]byte, 16*constant.Mi)
}
```
用同样的启动方式，再次启动，查看GC日志

![](https://files.mdnice.com/user/75626/badf5a93-60a8-4111-b5f3-b2c257fad84f.png)

可以发现，程序的GC频度要低了很多，以至于短时间内都看不到GC日志了，程序的内存使用情况也很低

![](https://files.mdnice.com/user/75626/c4713d6f-2274-44eb-a801-27cbce78c21a.png)

## 3.4 协程泄漏排查
Go程序是自带垃圾回收的，所以一般情况下是不会发生内存泄漏的。通过以上的排查发现，这个程序的问题还是挺多的，有没有协程泄漏方面的问题呢？同样。我们保持程序运行一段时间，然后访问[http://localhost:6060/debug/pprof](http://localhost:6060/debug/pprof) 这个地址，查看一下各个指标的大致情况

![](https://files.mdnice.com/user/75626/1445dd53-548d-4564-8b3c-c9e80e0ffeba.png)

可以看到，`goroutine`已经达到了`114`，虽然对于Go程序来说，`goroutine`达到`100`并不算多，但这个程序只是一个简单的demo程序，可能还是存在一定的协程泄漏。接下来我们就来定位一下这个问题，看看是否真的发生了协程泄漏。执行以下命令
```go
go tool pprof http://localhost:6060/debug/pprof/goroutine
```
接下来，同样是`top`，`list`，`web`命令三件套

![](https://files.mdnice.com/user/75626/a291887f-3c41-4eb6-8e6d-c5c6e7880872.png)

执行`web`命令之后的可视化界面如下

![](https://files.mdnice.com/user/75626/fad3dabb-7c7d-46a3-98e7-c512c1b7c46e.png)

这次可视化界面显示的内容很多，但根据问题代码会很醒目的原则，还是不难发现，问题在于`github.com/wolfogre/go-pprof-practice/animal/canidae/wolf.(*Wolf).Drink`这个方法
```go
func (w *Wolf) Drink() {
    log.Println(w.Name(), "drink")
    for i := 0; i < 10; i++ {
       go func() {
          time.Sleep(30 * time.Second)
       }()
    }
}
```
这个方法每次调用的时候会创建`10`个`goroutine`，每个`goroutine`会睡眠`30秒`再退出，如果`Drink`函数被反复调用的话，就可能导致大量协程泄露  
同样的解决方案，我们注释掉问题代码，再次编译运行程序，然后访问[http://localhost:6060/debug/pprof](http://localhost:6060/debug/pprof) 这个地址，查看页面上的`goroutine`情况
```go
func (w *Wolf) Drink() {
    log.Println(w.Name(), "drink")
    //for i := 0; i < 10; i++ {
    // go func() {
    //    time.Sleep(30 * time.Second)
    // }()
    //}
}
```
可以发现`goroutine`数量有了明显的下降，已经下降到了13个

![](https://files.mdnice.com/user/75626/db008a2b-1c22-4429-a5ea-b9bbc2fba0da.png)

## 3.5 锁竞争排查
上面的各个程序问题的排查发现程序确实存在很多的性能问题，索性我们将探究进行到底。看看还是否存在资源竞争方面的问题，首先想到的就是锁竞争问题，锁竞争虽然不会导致资源被大量占用，但是确会让程序效率低下，非常严重的影响程序的性能。其实仔细看我们上一步优化完协程泄漏之后的程序运行界面会发现，虽然`goroutine`数量下降到了13，但是`mutex`前面的数量显示为1，程序是否存在锁方面的问题呢？执行以下命令一探究竟
```go
go tool pprof http://localhost:6060/debug/pprof/mutex
```
同样是`top`，`list`，`web`命令三件套

![](https://files.mdnice.com/user/75626/1b8d45f8-268c-45c8-92da-c712bbfa8a5a.png)

执行`web`命令之后的可视化界面如下

![](https://files.mdnice.com/user/75626/7c82a4b8-023b-4507-a963-a29e8b9625ba.png)

不难发现，问题就出在`github.com/wolfogre/go-pprof-practice/animal/canidae/wolf.(*Wolf).Howl`这个方法里，我们具体看下这个函数
```go
func (w *Wolf) Howl() {
    log.Println(w.Name(), "howl")

    m := &sync.Mutex{}
    m.Lock()
    go func() {
       time.Sleep(time.Second)
       m.Unlock()
    }()
    m.Lock()
}
```
问题很明显，这里主协程有两次`lock`操作，主协程在第一次`lock`之后，然后启动子协程`unlock`，然后才能进行第二次`lock`。这里就会造成等待，由于子协程睡眠了一秒，导致主协程等待这个锁释要等1秒钟。所以如果有大量这个函数调用的话，就会有大量的锁等待。这里同样注释掉问题代码再来测试。注意这里只是个demo，所以逻辑很简单，具体的业务代码问题往往要复杂很多，要具体问题具体分析。这里可以简单注释掉等待`1s`的代码逻辑
```go
func (w *Wolf) Howl() {
    log.Println(w.Name(), "howl")

    m := &sync.Mutex{}
    m.Lock()
    go func() {
       //time.Sleep(time.Second)
       m.Unlock()
    }()
    m.Lock()
}
```
然后重新编译，启动。可视化界面查看锁等待情况

![](https://files.mdnice.com/user/75626/d3ac06de-94a9-4ef7-aa31-c6406ee6691f.png)

可以发现锁等待的时间明显降低

## 3.6 阻塞操作排查
接下来排查最后一个可能导致程序性能的问题，阻塞操作。上面的锁竞等待查严格来说也属于阻塞的一种，但是除了锁等待以外，还有很多逻辑会导致程序出现阻塞。在优化外上面的锁等待逻辑，重新编译启动程序后。我们保持程序正常运行，访问[http://localhost:6060/debug/pprof](http://localhost:6060/debug/pprof)，可以看到有三个block指标

![](https://files.mdnice.com/user/75626/e5430cea-d094-4a2e-8aff-d1890497f00a.png)

注意，这里的指标显示并不代表程序就一定有问题。我们还是按照常规套路来排查一下，执行以下命令
```go
go tool pprof http://localhost:6060/debug/pprof/block
```
继续`top`，`list`，`web`命令

![](https://files.mdnice.com/user/75626/8b294eda-c755-4f56-808a-54f478d4fb0c.png)

`top`命令后可以看到有`Live`和`Pee`两个方法可能出现问题，接着`list`详细查看

![](https://files.mdnice.com/user/75626/f2e8f20e-348b-4155-bea6-cd866fde50ab.png)

可以看到，`cat.(*Cat).Live`方法里都是调用的`cat`的一些其他方法，其中就包括了`cat.(*Cat).Pee`方法。主要是这个方法导致了耗时。
而`cat.(*Cat).Pee`方法就很容易发现问题

```go
func (c *Cat) Pee() {
    log.Println(c.Name(), "pee")

    <-time.After(time.Second)
}

```
这个函数里会一直阻塞，直到从一个管道读取到数据，而从管道读取数据会在`1s`之后，只有`1s`之后才能解除阻塞，从逻辑上来看这个代码没有什么问题。当然我们也可以跟上述测试一下，注释到这部分代码，再做测试，这里就不再重复演示了。

# 4. 小结
这篇文章通过一个简单的demo程序介绍了怎么通过`pprof`工具来定位Go程序的一些性能问题。大致的排查方法都是相通的，首先要在程序中引入`pprof`包，使其注册`handler`到`http server`，然后通过http接口来获取数据采样报告。接着就是运用`go tool prrof`工具来排查不同的指标。在交互式终端通过`top`，`list`，`we`命令三件套来逐步定位到问题代码。也可以直接在交互式终端输入`web`命令，通过浏览器直观的发现程序中的代码问题所在。
当然，本文只是简单了做了一个`prrof`工具的实战讲解，`pprof`还有很多的使用方法没有讲解到，大家可以通过`go go tool pprof --help`来查看详细用法或者是通过pprof官网官网来查看具体用法。  
最后，看完这篇文章如果想要动手实践一下文章的各个排查案例，可以关注公众号：**IT杨秀才，回复：pprof实战**，即可获取实践代码


# 学习交流
> 如果您觉得文章有帮助，点个关注哦。可以关注公众号：**IT杨秀才**，秀才后面会在公众号分享**线上问题排查**的系列知识。也会持续更新更多硬核文章，一起聊聊互联网那些事儿!
![公众号二维码](https://files.mdnice.com/user/75626/8698017c-53c4-462f-b49e-8dce5a09aa44.jpg)


-----------------------------**历史好文**-------------------------------  
[《Go程序数据库连接池耗尽如何排查》](https://mp.weixin.qq.com/s/vqCbmW9uJJ_D-CEhvHlu-A)  
[《Java线上死锁问题如何排查》](https://mp.weixin.qq.com/s/S7FShnuDL5b-Se8lkJU80Q)    
[《线上慢SQL问题如何排查》](https://mp.weixin.qq.com/s/vYGwzEZjtubXzcrcdZmvJA)  
[《线上CPU飙高如何排查》](https://mp.weixin.qq.com/s/JGEGj3kIBwEBfOJCUO4lsA)   
[《线上OOM问题如何排查》](https://mp.weixin.qq.com/s/8mmXy2hY_it35xLOrjfvWA)   
[《频繁FullGC问题如何排查》](https://mp.weixin.qq.com/s/9mBfPWUGyCJOEHyeYnT-IA)   
[《2024年必备的Go语言学习路线（建议收藏🔥）》](https://mp.weixin.qq.com/s?__biz=Mzk0MTYxNDgyNA==&mid=2247484357&idx=1&sn=d49f8ac58b19dee9ffc1e07b7a4e451e&chksm=c2cef042f5b97954f397f5428666a9d773d13e555cb1cbca0f97d9a21361fcf0d162752c4f53&token=983111685&lang=zh_CN#rd) 

