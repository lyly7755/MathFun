import json, re, itertools, sys
SEGS='abcdefg'
SEG={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg'}
def m(chars, alph): 
    v=0
    for c in chars: v|=1<<alph.index(c)
    return v
DMASK={d:m(s,SEGS) for d,s in SEG.items()}
MASK2D={v:k for k,v in DMASK.items()}
OPS='hv'
OMASK={'-':m('h',OPS),'+':m('hv',OPS)}
MASK2O={v:k for k,v in OMASK.items()}

def encode(s):
    st=[]
    for ch in s:
        if ch.isdigit(): st.append(('d',DMASK[ch]))
        elif ch in '+-': st.append(('o',OMASK[ch]))
        else: st.append(('e',3))
    return st
NBITS={'d':7,'o':2,'e':2}
def decode(st):
    out=[]
    for t,v in st:
        if t=='d':
            c=MASK2D.get(v)
        elif t=='o':
            c=MASK2O.get(v)
        else:
            c='=' if v==3 else None
        if c is None: return None
        out.append(c)
    return ''.join(out)

def neighbors(s):
    st=encode(s); n=len(st); out=set()
    filled=[(i,b) for i,(t,v) in enumerate(st) for b in range(NBITS[t]) if v>>b&1]
    empty=[(j,b) for j,(t,v) in enumerate(st) for b in range(NBITS[t]) if not v>>b&1]
    for i,bi in filled:
        for j,bj in empty:
            if i==j and bi==bj: continue
            vs=[v for _,v in st]
            vs[i]&=~(1<<bi); vs[j]|=1<<bj
            d=decode([(st[k][0],vs[k]) for k in range(n)])
            if d and d!=s: out.add(d)
    return out

def truthy(e):
    l,r=e.split('=')
    for side in (l,r):
        if not side or side[0] in '+-' or side[-1] in '+-': return False
        for num in side.replace('+',' ').replace('-',' ').split():
            if len(num)>1 and num[0]=='0': return False
    return eval(l)==eval(r)

def build(pat):
    slots=['0123456789' if c=='d' else ('+-' if c=='o' else '=') for c in pat]
    S=[''.join(c) for c in itertools.product(*slots)]
    S=[s for s in S if not re.search(r'(^|[+\-=])0\d',s)]
    Sset=set(S)
    adj={s:neighbors(s)&Sset for s in S}
    T={s for s in S if truthy(s)}
    d1={s:sorted(adj[s]&T) for s in S if s not in T and adj[s]&T}
    d2={}
    for s in S:
        if s in T or s in d1: continue
        sol=set()
        for mmm in adj[s]: sol|=adj[mmm]&T
        if sol: d2[s]=sorted(sol)
    return S,T,d1,d2

res={}
for pat in ['doded','dodedd','ddoded']:
    S,T,d1,d2=build(pat)
    res[pat]={'1':d1,'2':d2}
    print(pat,len(S),'true',len(T),'1m',len(d1),'2m',len(d2)); sys.stdout.flush()
json.dump(res, open('graph.json','w'))
print('done')
