interface BalanceHeaderProps {
  amount: string;
  currency: string;
}

function BalanceHeader({ amount, currency }: BalanceHeaderProps) {
  return (
    <div className="text-center select-none">
      <span className="font-inter font-bold text-[40px] leading-none text-white">
        {amount} {currency}
      </span>
    </div>
  );
}

export default BalanceHeader;
