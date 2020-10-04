export default function truncate(str: string, len: number) {
    if (str.length > len)
        return str.substr(0, len) + '...';
    else
        return str;
}