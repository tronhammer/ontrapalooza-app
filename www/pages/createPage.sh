for fn in $(find ./* -name *.$1*); 
do
    mv $fn $(echo $fn | sed -e "s/.$1/.$2/g");
done;
