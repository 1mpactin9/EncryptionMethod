1. file .key give me the things to copy inside to this key file, remember format, should contain extra info, remember formatting so other code can read. Contain 5 custom PRIVATE_KEYS, 1 forever USERNAME: "1mpactin9", and 1 forever PASSWORD: "1mpactin9", give me **Code 1** for generating these custom private keys, use pseudo inverse/reverse randomizers, remember the size and format of these keys, these keys should be hex
2. **Code 2** encrypts the secret .key file, with given key generated randomly using pseudo inverse or reverse calculations
3. **Code 3** main file of
   1. when open, it first requires the username and password 
   2. Everytime it will require the user to give the key, it temporarily decrypts the encrypted secret and stores the key temporarily 
   3. Using this temporary key it encrypts or decrypts a given data, a complete eds but adding a layer of protection for the .key 
   4. Uses tqdm, rich, progress, and/or other well known interface libraries 
   5. Fully automated easy to use