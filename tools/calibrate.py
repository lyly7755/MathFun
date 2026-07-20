import os
"""Score every shipped puzzle on structural features that plausibly drive difficulty,
then order each tier by the composite. Features are computable facts about the puzzle;
the weights are a judgement call and are stated explicitly."""
import json, re, sys
sys.path.insert(0,'_dev')
from engine import parse, render, truthy, moves, SEG

html=open(os.path.join(os.path.dirname(__file__),'..','index.html'),encoding='utf-8').read()
RAW=json.loads(re.search(r'var RAW=(\{.*?\});', html, re.S).group(1))

def feats(p, s, m):
    tk=parse(p)
    # --- branching: how many source/target pairs the UI will accept ---
    branch=0
    for i,(ti,si) in enumerate(tk):
        for j,(tj,sj) in enumerate(tk):
            from engine import ALLSLOTS
            for slot in si:
                for t in ALLSLOTS[tj]:
                    if t in sj: continue
                    if i==j and t==slot: continue
                    branch+=1
    # --- decoys: single moves that still LOOK like a real equation ---
    renderable=0; decoys=0; midValid=0
    for *_, nt in moves(tk):
        e=render(nt)
        if e is None or len(e)!=len(p): continue
        renderable+=1
        if not truthy(e): decoys+=1
        else: pass
    if m==2:
        # can the pair be played so the halfway board still reads as an equation?
        for *_, nt in moves(tk):
            e=render(nt)
            if e is None or len(e)!=len(p): continue
            for *_, nt2 in moves(nt):
                if render(nt2)==s: midValid+=1; break
    # --- what actually changes between puzzle and answer ---
    digitsChanged=sum(1 for a,b in zip(p,s) if a!=b and a.isdigit() and b.isdigit())
    opChange=any(a!=b for a,b in zip(p,s) if a in '+-' or b in '+-')
    # --- does a stick have to travel between tokens? ---
    ts=parse(s); lose=set(); gain=set()
    for i,((t1,a),(t2,b)) in enumerate(zip(tk,ts)):
        if a-b: lose.add(i)
        if b-a: gain.add(i)
    crossToken = 1 if (lose-gain or gain-lose) else 0
    return dict(branch=branch, decoys=decoys, digitsChanged=digitsChanged,
                opChange=1 if opChange else 0, crossToken=crossToken, midValid=midValid)

rows={}
for pack in ('easy','medium','hard'):
    rows[pack]=[]
    for p,m,s in RAW[pack]:
        f=feats(p,s,m); f['p']=p; f['m']=m; f['s']=s
        rows[pack].append(f)
    print(pack,'scored',len(rows[pack]))

def z(vals):
    n=len(vals); mu=sum(vals)/n
    sd=(sum((v-mu)**2 for v in vals)/n)**.5 or 1.0
    return mu,sd

# branch was dropped: it mostly counts empty slots, which is highest for sparse
# digits like 1 and 7 - i.e. it tracked EASY puzzles, the opposite of its motivation.
WEIGHTS=dict(decoys=.40, digitsChanged=.25, crossToken=.20, opChange=.15, midValid=-.20)
for pack in rows:
    keys=[k for k in WEIGHTS if any(r[k] for r in rows[pack])]
    stats={k:z([r[k] for r in rows[pack]]) for k in keys}
    for r in rows[pack]:
        r['score']=sum(WEIGHTS[k]*((r[k]-stats[k][0])/stats[k][1]) for k in keys)
    rows[pack].sort(key=lambda r:r['score'])
    print()
    print('===',pack.upper(),'=== features used:',sorted(keys))
    for lbl,sl in (('easiest 5',rows[pack][:5]),('hardest 5',rows[pack][-5:])):
        print(' ',lbl)
        for r in sl:
            print('   %-9s -> %-9s score %+.2f  decoys %2d  branch %3d  digits %d  cross %d  op %d'
                  %(r['p'],r['s'],r['score'],r['decoys'],r['branch'],r['digitsChanged'],r['crossToken'],r['opChange']))
    sc=[r['score'] for r in rows[pack]]
    print('  score range %.2f .. %.2f'%(sc[0],sc[-1]))

json.dump({k:[[r['p'],r['m'],r['s']] for r in v] for k,v in rows.items()}, open('_dev/ordered.json','w'))
