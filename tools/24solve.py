from fractions import Fraction as F
from itertools import combinations_with_replacement
import json

def solve(vals, target=F(24)):
    """all distinct solutions, as expression strings"""
    def rec(items):           # items: list of (Fraction, expr)
        if len(items)==1:
            return {items[0][1]} if items[0][0]==target else set()
        out=set()
        n=len(items)
        for i in range(n):
            for j in range(n):
                if i==j: continue
                a,ea=items[i]; b,eb=items[j]
                rest=[items[k] for k in range(n) if k!=i and k!=j]
                cands=[]
                if i<j:
                    cands.append((a+b, '('+ea+'+'+eb+')'))
                    cands.append((a*b, '('+ea+'*'+eb+')'))
                cands.append((a-b, '('+ea+'-'+eb+')'))
                if b!=0: cands.append((a/b, '('+ea+'/'+eb+')'))
                for v,e in cands:
                    out |= rec(rest+[(v,e)])
        return out
    return rec([(F(v),str(v)) for v in vals])

def needs_fraction(vals):
    """is every solution forced through a non-integer intermediate?"""
    def rec(items, frac):
        if len(items)==1:
            return items[0][0]==F(24) and frac
        n=len(items)
        for i in range(n):
            for j in range(n):
                if i==j: continue
                a=items[i][0]; b=items[j][0]
                rest=[items[k] for k in range(n) if k!=i and k!=j]
                for v in ([a+b,a*b] if i<j else [])+[a-b]+([a/b] if b!=0 else []):
                    if rec(rest+[(v,'')], frac or v.denominator!=1): return True
        return False
    # true if solvable ONLY with a fractional step
    def solvable_int_only(items):
        if len(items)==1: return items[0][0]==F(24)
        n=len(items)
        for i in range(n):
            for j in range(n):
                if i==j: continue
                a=items[i][0]; b=items[j][0]
                rest=[items[k] for k in range(n) if k!=i and k!=j]
                for v in ([a+b,a*b] if i<j else [])+[a-b]+([a/b] if b!=0 else []):
                    if v.denominator!=1: continue
                    if solvable_int_only(rest+[(v,'')]): return True
        return False
    return not solvable_int_only([(F(v),'') for v in vals])

for hi,label in ((10,'A-10 (face cards = 10 or excluded)'), (13,'A-K  (J=11 Q=12 K=13)')):
    hands=list(combinations_with_replacement(range(1,hi+1),4))
    solvable=[]; counts={}
    for h in hands:
        s=solve(h)
        if s: solvable.append((h,len(s)))
    print(f"{label}: {len(solvable)}/{len(hands)} distinct hands solvable ({100*len(solvable)/len(hands):.0f}%)")
    n=[c for _,c in solvable]
    n.sort()
    print(f"   solution counts: min {min(n)}  median {n[len(n)//2]}  max {max(n)}")
    print(f"   hands with exactly 1 solution: {sum(1 for c in n if c==1)}")
    print(f"   hands with <=3 solutions:      {sum(1 for c in n if c<=3)}")
    print(f"   hands with >=20 solutions:     {sum(1 for c in n if c>=20)}")
    if hi==13:
        frac=[h for h,c in solvable if needs_fraction(h)]
        print(f"   hands solvable ONLY via a fractional step: {len(frac)}  e.g. {frac[:5]}")
    print()
print("example solutions for the classic hard one, 3 3 8 8:", sorted(solve((3,3,8,8)))[:3])
