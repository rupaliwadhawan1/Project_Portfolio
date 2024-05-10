from flask import Flask, request, redirect, session, render_template, url_for
import pandas as pd

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# In-memory dataframe to store user credentials
users_df = pd.DataFrame(columns=['username', 'password'])


@app.route("/")
def main():
    return render_template("login.html")

@app.route("/login")
def mains():
    return render_template("login.html")

# Add a route for GET requests to '/register' to render the registration page
@app.route("/register")
def show_register():
    return render_template("register.html")

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']
    # Add check for existing user
    if not users_df[users_df['username'] == username].empty:
        return "User already exists", 400
    # Add new user
    users_df.loc[len(users_df)] = [username, password]
    # After registration, redirect to the login page or render it
    return render_template("login.html")

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    # Authenticate user
    if not users_df[(users_df['username'] == username) & (users_df['password'] == password)].empty:
        session['username'] = username
        # Use redirect for navigation after login
        return render_template("index.html")
    else:
        return "Invalid credentials", 401

@app.route("/index")
def index():
    # Check if user is in session
    if 'username' in session:
        return render_template("index.html")
    else:
        # Redirect to login page if the user is not logged in
        return redirect(url_for('main'))
    


if __name__ == '__main__':
    app.run(debug=True)
    print(users_df)
    
    
    