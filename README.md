combo
=====


Nodejs实现的文件合并combo服务

---

### 现在设计中的功能如下

- 根据请求URL合并相应文件
	- URL规则可配置，具体参数有：
		> {  
		> 	basePath: '',  
		>	alias: {},  
		>	delimiter: ''  
		> }  

		1. basePath 即url中文件路径的默认基准路径；  
		2. alias 用于处理特殊请求。例如设置了{ basePath: './static/', alias： {'res': './res/'}}，则当遇到‘a:res/tmp.js’（‘a:’为使用alias的标志）这样的文件路径时，使用‘./res/’作为basePath，而不使用‘./static/’；  
		3. delimiter 用于设置url中不同文件路径的分隔符，默认为‘,’。  
	- 例如有如下请求（使用上面的配置）：
		> http://yoursite.com/combo?a/a.js,b/b.js,a:a/a.js  

		此时解析所得路径分别是：
		> ./static/a/a.js  
		> ./static/b/b.js  
		> ./res/a/a.js
- 实现服务端的文件压缩。使用YUICompressor实现。
- 实现debug模式，启动debug模式时，返回一段JS使客户端分别加载各个未压缩文件
- 合并好的文件保存于硬盘并缓存，并使用LRU策略保证自动清除缓存中最久未使用文件，控制缓存的文件数量大小
