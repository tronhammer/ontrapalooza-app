for fn in $(find ./* -name *.$1*); 
do
    mv $fn $(echo $fn | sed -e "s/.$1/.$2/g");
done;

sed -ie "s/basic/$2/g" js/oplz.page.$2.js
sed -ie "s/Basic/${2^}/g" js/oplz.page.$2.js
