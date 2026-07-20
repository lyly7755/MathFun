from itertools import product

SEG = {
 '0': set('abcdef'),
 '1': set('bc'),
 '2': set('abged'),
 '3': set('abgcd'),
 '4': set('fgbc'),
 '5': set('afgcd'),
 '6': set('afgedc'),
 '7': set('abc'),
 '8': set('abcdefg'),
 '9': set('abcdfg'),
}
PAT2DIG = {frozenset(v): k for k, v in SEG.items()}
OP = {'-': set('h'), '+': set('hv')}
PAT2OP = {frozenset(v): k for k, v in OP.items()}

def parse(s):
    toks = []
    for ch in s:
        if ch.isdigit():
            toks.append(('d', set(SEG[ch])))
        elif ch in '+-':
            toks.append(('o', set(OP[ch])))
        elif ch == '=':
            toks.append(('e', set('xy')))
        else:
            raise ValueError(ch)
    return toks

ALLSLOTS = {'d': list('abcdefg'), 'o': list('hv'), 'e': list('xy')}

def render(toks):
    out = []
    for t, s in toks:
        if t == 'd':
            k = PAT2DIG.get(frozenset(s))
            if k is None: return None
            out.append(k)
        elif t == 'o':
            k = PAT2OP.get(frozenset(s))
            if k is None: return None
            out.append(k)
        else:
            if s != set('xy'): return None
            out.append('=')
    return ''.join(out)

def truthy(expr):
    if expr is None: return False
    if expr.count('=') != 1: return False
    l, r = expr.split('=')
    for side in (l, r):
        if not side or side[-1] in '+-': return False
        for num in side.replace('+', ' ').replace('-', ' ').split():
            if len(num) > 1 and num[0] == '0': return False
    if l[0] in '+-' or r[0] in '+-': return False
    try:
        return eval(l) == eval(r)
    except Exception:
        return False

def moves(toks):
    """yield (from_idx, from_slot, to_idx, to_slot, new_toks)"""
    for i, (ti, si) in enumerate(toks):
        for slot in sorted(si):
            for j, (tj, sj) in enumerate(toks):
                for tslot in ALLSLOTS[tj]:
                    if tslot in sj: continue
                    if i == j and tslot == slot: continue
                    nt = [(t, set(s)) for t, s in toks]
                    nt[i][1].discard(slot)
                    nt[j][1].add(tslot)
                    yield (i, slot, j, tslot, nt)

def solve(start, n):
    toks = parse(start)
    sols = set()
    def rec(cur, depth):
        if depth == n:
            e = render(cur)
            if truthy(e): sols.add(e)
            return
        for *_, nt in moves(cur):
            rec(nt, depth + 1)
    rec(toks, n)
    return sols

def check(p, n):
    exact = solve(p, n)
    fewer = set()
    for k in range(1, n):
        fewer |= solve(p, k)
    return exact, fewer

