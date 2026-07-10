import winpty
import os
import time
p = r"D:\learning\Coder's-Nest\host_workspaces\workspace_3"
os.makedirs(p, exist_ok=True)
pty = winpty.PtyProcess.spawn('powershell.exe', cwd=p)
time.sleep(3)
print(repr(pty.read(1024)))
print(repr(pty.read(1024)))
