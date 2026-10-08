const routes=[[
[0,'move',1,4],[0,'rescue',1,3],[1,'move',5,4],[1,'rescue',5,3],'next',
[0,'move',2,3],[0,'water',2,1],[1,'move',4,3],[1,'water',4,1],'next',
[0,'move',3,4],[0,'rescue',3,5]],
[[0,'move',1,4],[0,'rescue',1,3],[1,'move',5,4],[1,'rescue',5,3],'next',
[0,'move',0,3],[0,'water',0,2],[1,'move',6,3],[1,'water',6,2],'next',
[0,'move',2,3],[0,'water',3,2],[1,'move',4,3],[1,'water',4,1],'next',
[0,'move',3,4],[0,'rescue',3,5]],
[[0,'move',1,4],[0,'rescue',1,3],[1,'move',5,4],[1,'rescue',5,3],'next',
[0,'move',2,3],[0,'water',2,2],[1,'move',4,3],[1,'water',4,1],'next',
[0,'move',1,4],[0,'move',0,5],[1,'move',3,4],[1,'rescue',3,5],'next',
[0,'refill',0,6],[0,'move',0,3],[1,'move',3,2],[1,'cut',3,1],'next',
[0,'water',0,1],[0,'move',2,3],'next',[0,'water',2,1]]];
module.exports=routes;
