# Auth test:

1. In Postman, call this:

url: http://localhost:3000/api/auth/sign-in/email
body: {
  "email": "user@example.com",
  "password": "password"
}

this will return something along the lines of:
```json
{
    "redirect": false,
    "token": "sdaldmaslkdmlkasmdlk",
    "user": {
        "id": "dasdnklasndlkasnl",
        "email": "user@example.com",
        "name": "John Doe",
        "image": null,
        "emailVerified": false,
        "createdAt": "2025-10-23T20:51:10.091Z",
        "updatedAt": "2025-10-23T20:51:10.091Z"
    }
}
```

2. Add the `token` to the headers of postman in the following way:
Key: `Cookie`
Value: `better-auth.session=sdaldmaslkdmlkasmdlk`

Also, Postman will auto store another token better-auth.session-key, you need both for this to work. TRPC UI breaks when using auth tokens, so I have removed trpcui

3. Call the trpc endpoint as such:
GET http://localhost:3000/api/trpc/user.getUserData?input={"user_id":"GANyQUd1PuKzCcEF7CIii4DMaMDCWSyn"}

make sure to pass input json as a query param: `?input={data:"replace_me"}`