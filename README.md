
## webrtc https server(nodejs)

#### 1. 安装依赖
	 $ npm install
	
#### 2. 运行服务器
	 $ node index.js   OR   nodejs index.js

#### 3. 浏览
	 在浏览器中使用https:// [本机ip]:8081



#### 测试ice
	https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

#### 用于测试的stun服务器
	stun:stun.schlund.de
	stun:stun.voipstunt.com


####命令行测试stun服务器
	node-stun-client -s stun.schlund.de
	@ https://github.com/summerwind/node-stun