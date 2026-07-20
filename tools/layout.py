"""Evaluate the shipped card-size rule against real devices, both orientations.
Guards the bug where four fixed-width cards wrapped onto two rows on a 360px phone."""
import os, re
APP=os.path.join(os.path.dirname(__file__),'..','index.html')
h=open(APP,encoding='utf-8').read()
m=re.search(r'--cw: clamp\((\d+)px, min\(calc\(\(100vw - (\d+)px\) / 4\), '
            r'calc\(\(100vh - (\d+)px\) / 1\.42\)\), (\d+)px\)', h)
assert m, 'could not find the --cw rule in index.html'
lo, wslack, hslack, hi = map(int, m.groups())
GAP, PAD = 10, 12
print(f"rule: clamp({lo}px, min((100vw-{wslack})/4, (100vh-{hslack})/1.42), {hi}px)\n")
clamp=lambda a,v,b: max(a,min(v,b))
DEV=[('iPhone SE',320,568),('iPhone 12 mini',360,780),('Android common',360,800),
     ('iPhone 14',390,844),('iPhone 14 Pro Max',430,932),('Pixel Tablet',800,1280),
     ('iPad mini',744,1133),('iPad Pro 11"',834,1194),('iPad Pro 12.9"',1024,1366)]
print(f"{'device':20}{'viewport':>12}{'card':>6}{'row':>6}{'wide':>6}{'tall':>6}")
bad=0
for name,w,ht in DEV:
    for o in (0,1):
        vw,vh=(w,ht) if o==0 else (ht,w)
        cw=clamp(lo,min((vw-wslack)/4,(vh-hslack)/1.42),hi)
        row=4*cw+3*GAP+2*PAD
        chrome=46+20+54+(32 if vh<=640 else 44)+(60 if vh<=640 else 76)
        okw, okh = row<=vw, cw*1.42+chrome<=vh
        bad += (not okw)+(not okh)
        print(f"{(name if o==0 else ''):20}{vw:>5}x{vh:<6}{cw:>6.0f}{row:>6.0f}"
              f"{'ok' if okw else 'WRAP':>6}{'ok' if okh else 'OVER':>6}")
print()
print('LAYOUT FITS ALL 9 DEVICES IN BOTH ORIENTATIONS' if bad==0 else f'{bad} LAYOUT PROBLEMS')
raise SystemExit(1 if bad else 0)
