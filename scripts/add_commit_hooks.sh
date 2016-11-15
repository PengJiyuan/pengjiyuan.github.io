#!/bin/bash
# CSC, Code Style Checker

FILE="pre-commit"

cd .git/hooks

if [ ! -e $FILE ]
  then
    touch $FILE
    chmod +x $FILE
fi

echo -e "#!/bin/bash\n\n# CSC, Code Style Checker\n\ncd $1\nnpm run eslint" > $FILE