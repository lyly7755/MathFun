from fractions import Fraction as F
from itertools import combinations_with_replacement
import json, random

def solutions(vals):
    def rec(items):
        if len(items)==1:
            return {items[0][1]} if items[0][0]==F(24) else set()
        out=set(); n=len(items)
        for i in range(n):
            for j in range(n):
                if i==j: continue
                a,ea=items[i]; b,eb=items[j]
                rest=[items[k] for k in range(n) if k!=i and k!=j]
                cands=[]
                if i<j:
                    cands.append((a+b,'('+ea+'+'+eb+')'))
                    cands.append((a*b,'('+ea+'*'+eb+')'))
                cands.append((a-b,'('+ea+'-'+eb+')'))
                if b!=0: cands.append((a/b,'('+ea+'/'+eb+')'))
                for v,e in cands: out |= rec(rest+[(v,e)])
        return out
    return rec([(F(v),str(v)) for v in vals])

hands=[]
for h in combinations_with_replacement(range(1,14),4):
    s=solutions(h)
    if s: hands.append((list(h), len(s), min(s, key=len)))
print('solvable hands:', len(hands))

easy   = sorted([h for h in hands if h[1]>=20], key=lambda x:-x[1])
medium = sorted([h for h in hands if 4<=h[1]<20], key=lambda x:-x[1])
hard   = sorted([h for h in hands if h[1]<=3],  key=lambda x:-x[1])
print('pools -> easy',len(easy),'medium',len(medium),'hard',len(hard))

random.seed(24)
def take(pool,n,used):
    out=[]
    for h in pool:
        k=tuple(h[0])
        if k in used: continue
        used.add(k); out.append(h)
        if len(out)==n: break
    return out

used=set()
# spread each tier across its pool so the ramp is smooth, not front-loaded
def spread(pool,n):
    step=max(1,len(pool)//n)
    return [pool[i*step] for i in range(n) if i*step<len(pool)]

packs={}
for name,pool in (('easy',easy),('medium',medium),('hard',hard)):
    sel=take(spread(pool,60),60,used)
    sel.sort(key=lambda x:-x[1])            # most solutions first = easiest first
    packs[name]=sel
    print(name, len(sel), 'solution counts', sel[0][1], '->', sel[-1][1])

rest=[h for h in hands if tuple(h[0]) not in used]
random.shuffle(rest)
packs['daily']=take(rest,200,used)
print('daily', len(packs['daily']))

out={k:[[h[0],h[1]] for h in v] for k,v in packs.items()}
json.dump(out, open('_dev/hands24.json','w'), separators=(',',':'))
json.dump({k:[[h[0],h[1],h[2]] for h in v] for k,v in packs.items()},
          open('_dev/hands24_full.json','w'), indent=0)
print('\nsamples:')
for k in ('easy','medium','hard'):
    for h in packs[k][:2]+packs[k][-1:]:
        print(f'  {k:7} {h[0]}  {h[1]:>3} solutions   e.g. {h[2]}')
print('bytes:', len(json.dumps(out,separators=(',',':'))))
