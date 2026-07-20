import os
"""Independent check: every puzzle shipped in the HTML must trace back to the
exhaustive solver output in graph.json, with the same move count and solution."""
import json, re, sys
html=open(os.path.join(os.path.dirname(__file__),'..','index.html'),encoding='utf-8').read()
raw=json.loads(re.search(r'var RAW=(\{.*?\});', html, re.S).group(1))
graph=json.load(open(os.path.join(os.path.dirname(__file__),'..','data','matchstick_solver_output.json')))

book={}
for shape in graph:
    for mv in ('1','2'):
        for p,sols in graph[shape][mv].items():
            book.setdefault(p,[]).append((int(mv),sols))

bad=0; seen={}
for pack,rows in raw.items():
    for p,m,s in rows:
        if p in seen:
            print('DUPLICATE across packs:',p,seen[p],pack); bad+=1
        seen[p]=pack
        ent=book.get(p)
        if not ent:
            print('NOT IN SOLVER OUTPUT:',p); bad+=1; continue
        mvs=dict((a,b) for a,b in ent)
        if m not in mvs:
            print('MOVE COUNT MISMATCH:',p,'shipped',m,'solver',sorted(mvs)); bad+=1; continue
        if mvs[m]!=[s]:
            print('SOLUTION MISMATCH:',p,'shipped',s,'solver',mvs[m]); bad+=1; continue
        if m==2 and 1 in mvs:
            print('LABELLED 2-MOVE BUT SOLVABLE IN 1:',p); bad+=1
        if re.search(r'(^|[+\-=])0\d', p) or re.search(r'(^|[+\-=])0\d', s):
            print('LEADING ZERO:',p,s); bad+=1

counts={k:len(v) for k,v in raw.items()}
print('packs:', counts, '| total', sum(counts.values()))
print('all puzzles distinct:', len(seen)==sum(counts.values()))
print(('FAILURES: '+str(bad)) if bad else ('ALL '+str(len(seen))+' SHIPPED PUZZLES TRACE TO VERIFIED SOLVER OUTPUT'))
sys.exit(1 if bad else 0)
