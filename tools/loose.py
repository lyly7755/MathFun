import os
"""What if a slot showing only verticals reads as the 1s it forms?
   bc -> '1'   ef -> '1'   bcef -> '11'
   Check: (a) does that make the user's board a legal solution,
          (b) how many shipped puzzles get easier or gain extra answers."""
import json, re, itertools
SEG={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg'}
DS='abcdefg'; OS='hv'; ES='xy'
def mk(s,al):
    v=0
    for c in s: v|=1<<al.index(c)
    return v
STRICT={mk(v,DS):k for k,v in SEG.items()}
LOOSE=dict(STRICT)
LOOSE[mk('ef',DS)]='1'          # left-hand vertical pair
LOOSE[mk('bcef',DS)]='11'       # both vertical pairs = two 1s
OMASK={'-':mk('h',OS),'+':mk('hv',OS)}; M2O={v:k for k,v in OMASK.items()}
NB={'d':7,'o':2,'e':2}

def enc(s):
    o=[]
    for ch in s:
        if ch.isdigit(): o.append(('d',mk(SEG[ch],DS)))
        elif ch in '+-': o.append(('o',OMASK[ch]))
        else: o.append(('e',3))
    return o
def dec(st, table):
    out=''
    for t,v in st:
        if t=='d':
            c=table.get(v)
        elif t=='o': c=M2O.get(v)
        else: c='=' if v==3 else None
        if c is None: return None
        out+=c
    return out
def true(e):
    if e is None or e.count('=')!=1: return False
    l,r=e.split('=')
    for side in (l,r):
        if not side or side[0] in '+-' or side[-1] in '+-': return False
        for n in side.replace('+',' ').replace('-',' ').split():
            if len(n)>1 and n[0]=='0': return False
    try: return eval(l)==eval(r)
    except Exception: return False
def nbrs(st):
    out=[]
    for i,(ti,vi) in enumerate(st):
        for b in range(NB[ti]):
            if not vi>>b&1: continue
            for j,(tj,vj) in enumerate(st):
                for c in range(NB[tj]):
                    if vj>>c&1: continue
                    if i==j and b==c: continue
                    ns=list(st)
                    ns[i]=(ti, vi & ~(1<<b)) if i!=j else (ti, vi & ~(1<<b))
                    if i==j: ns[i]=(ti,(vi & ~(1<<b))|(1<<c))
                    else:
                        ns[i]=(ti, vi & ~(1<<b)); ns[j]=(tj, vj|(1<<c))
                    out.append(tuple(ns))
    return out
def solutions(p,n,table):
    cur=[tuple(enc(p))]
    for _ in range(n):
        nx=[]
        for st in cur: nx.extend(nbrs(st))
        cur=nx
    found=set()
    for st in cur:
        e=dec(st,table)
        if e and true(e): found.add(e)
    return found

print("--- the board you built ---")
print("  puzzle 76+5=1, your board:")
u=solutions('76+5=1',2,LOOSE)
print("  '16-5=11' reachable in 2 moves under the loose reading:", '16-5=11' in u)
print("  16-5 =", 16-5)
print()
raw=json.loads(re.search(r'var RAW=(\{.*?\});', open(os.path.join(os.path.dirname(__file__),'..','index.html'),encoding='utf-8').read(), re.S).group(1))
tot=easier=extra=0
for pack in ('easy','medium','hard','daily'):
    pe=px=0
    for p,m,s in raw[pack]:
        tot+=1
        loose_n = solutions(p,m,LOOSE)
        if m==2 and solutions(p,1,LOOSE): pe+=1; easier+=1
        elif len(loose_n)>1: px+=1; extra+=1
    print(f"  {pack:7} {len(raw[pack]):>4} puzzles | now solvable in fewer moves: {pe:>3} | gains extra answers: {px:>3}")
print(f"\n  total {tot} | {easier} become easier than labelled | {extra} gain alternative answers")
