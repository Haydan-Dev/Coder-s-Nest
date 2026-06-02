from fastapi import FastAPI  

app = FastAPI() 

@app.get('/')
def Home():
    return{"Message":"main.py is running successfully"}

