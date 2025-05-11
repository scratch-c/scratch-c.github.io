title: "博客测试"
# 博客测试
###### 2025-05-11
###### 欢迎来到我的个人博客！这是我的第一篇测试文章。

## 文章内容
这里是我的博客正文...
- 列表项 1
- 列表项 2

代码示例：
```cpp
#include<cstdio>
#include<cstring>
#define max(x,y) ((x)^(((x)^(y))&(-((x)<(y))))) //手写max
template <typename _Tp>
inline void read(_Tp &x){
    int w=1;char c=0;x=0;
    while (c^'-'&&(c<'0'||c>'9'))c=getchar();
    if (c=='-')w=-1,c=getchar();
    while (c>='0'&&c<='9')x=(x<<1)+(x<<3)+(c^48),c=getchar();
    x*=w;
}
inline void write(int n){
    if(n==0) return;
    write(n/10);
    putchar(n%10+'0');
}//快读/快输
int que[100000000],dis[2011],v[1011][1011],ints[10000],qian[1011][1011],n,m,ans,cnt;//变量尽量一次定义
unsigned char bv[2011],G[1011][1011],st[2011];
inline void add(int s,int t,int l){
    G[s][t]=1;
    v[s][t]=max(v[s][t],l);
}
int main(){
    read(n),read(m);
    for(register int iii=1;iii<=m;iii++){
        read(cnt);
        memset(bv,0,sizeof(bv));
        for(register int i=1;i<=cnt;i++)read(ints[i]),bv[ints[i]]=1;
        for(register int i=1;i<=cnt;i++)
        for(register int j=ints[1];j<=ints[cnt];j++)if(!bv[j])add(j,ints[i],1);
    }//register定义变量很快的
    memset(bv,0,sizeof(bv));
    for(register int i=1;i<=n+1;i++)dis[i]=-1234567890;
    register int head=0,tail=1;que[0]=n+1;
    dis[n+1]=0;
    for(register int i=1;i<=n;i++)add(n+1,i,1);
    for(register int i=1;i<=n+1;i++)
    for(register int j=1;j<=n+1;j++)
    if(i!=j&&G[i][j])qian[i][0]++,qian[i][qian[i][0]]=j;
    do{
        int me=que[head];head++;bv[me]=0;
        for(register int j=1;j<=qian[me][0];j++){
            int i=qian[me][j];
            if(dis[me]+v[me][i]>dis[i]){
                dis[i]=dis[me]+v[me][i];
                if(!bv[i])bv[i]=1,que[tail++]=i;
            }
        }
    }while(head<tail);
    for(register int i=1;i<=n;i++)st[dis[i]]=1;
    for(register int i=1;i<=1000;i++)ans+=st[i];
    write(ans);
    return(0);
}
```
