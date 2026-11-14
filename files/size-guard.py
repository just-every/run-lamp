import json
import os
from pathlib import Path
import sqlite3
import shutil
import signal
import subprocess
import sys
import tempfile
import time
limit=200*1024*1024
root=Path(tempfile.mkdtemp(prefix='lamp-size-guard-'))
packet=Path('/home/agent/rer-consolidation/work/sd-lamp-qgrowth-incidents-3/packet')
label=sys.argv[1]
env=dict(os.environ,TMPDIR=str(root))
command=['node','/tmp/rer-size-tool/node_modules/@runeditrun/rer/bin/rer.mjs','size','--json','--write-statements',f'/tmp/lamp-size-{label}-guard-statements']
peak=0
peak_file=0
peak_database=0
breached=False
try:
 with (packet/f'size-{label}.json').open('w') as out,Path(f'/tmp/size-{label}-guard.log').open('w') as err:
  process=subprocess.Popen(command,stdout=out,stderr=err,env=env,start_new_session=True)
  while process.poll() is None:
   size=0
   largest=0
   largest_database=0
   for path in root.rglob('*'):
    try:
     if path.is_file() and not path.is_symlink():
      file_size=path.stat().st_size
      size+=file_size
      largest=max(largest,file_size)
      if path.suffix in ['.sqlite','.sqlite3','.db']:
       try:
        with sqlite3.connect('file:'+str(path)+'?mode=ro',uri=True,timeout=0.05) as connection:
         logical_bytes=connection.execute('PRAGMA page_count').fetchone()[0]*connection.execute('PRAGMA page_size').fetchone()[0]
        largest_database=max(largest_database,logical_bytes)
       except sqlite3.Error: pass
    except FileNotFoundError: pass
   peak=max(peak,size)
   peak_file=max(peak_file,largest)
   peak_database=max(peak_database,largest_database)
   if largest_database>limit:
    breached=True
    os.killpg(process.pid,signal.SIGTERM)
    break
   time.sleep(0.5)
  try: code=process.wait(timeout=15)
  except subprocess.TimeoutExpired:
   os.killpg(process.pid,signal.SIGKILL)
   code=process.wait()
 receipt=dict(command=command,source_sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),limit_bytes=limit,guard_scope="each SQLite database logical page_count * page_size, including committed WAL pages; journals are not database size",peak_database_bytes=peak_database,peak_file_bytes=peak_file,peak_disposable_temp_bytes=peak,guard_breached=breached,exit_code=code,synthetic_only=True)
 (packet/f'size-{label}-guard.json').write_text(json.dumps(receipt,indent=2)+'\n')
 print(json.dumps(receipt),flush=True)
 if breached: raise SystemExit(2)
 raise SystemExit(code)
finally:
 shutil.rmtree(root)
