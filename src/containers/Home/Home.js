import React, { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader/Loader";
import { Row, Col } from "reactstrap";
import Filter from "../../components/Filter/Filter";
import NoSearchResult from "../../components/NoSearchResults/NoSearchResult";
import PreviewCard from "../../components/PreviewCard/PreviewCard";
import useLocalStorage from "../../hooks/useLocalStorage";
import Axios from "axios";
import Pagination from "react-js-pagination";

const API_KEY = process.env.REACT_APP_API_KEY;

const Home = ({ location }) => {
  const [ls, setLs] = useLocalStorage("userFilter");
  const [, setArrItems] = useLocalStorage("items", []);
  const [cSelected, setCSelected] = useState(ls ? ls.cSelected : []);
  const [priceFrom, setPriceFrom] = useState(ls ? ls.priceFrom : "");
  const [priceTo, setPriceTo] = useState(ls ? ls.priceTo : "");
  const [cityID, setCityID] = useState(ls ? ls.cityID : 4);
  const [rate, setRate] = useState(null);
  const [currentPage, setCurrentPage] = useState(ls ? ls.currentPage : 1);
  const [limit] = useState(10);

  const apiURL = `search?api_key=${API_KEY}&city_id=${cityID}&stateID=4&category=1&realty_type=2&operation_type=1&page=0&characteristic[209][from]=${
    cSelected && cSelected.sort((a, b) => a - b)[0] ? cSelected.sort((a, b) => a - b)[0] : 1
  }${
    cSelected &&
    cSelected.sort((a, b) => a - b).length > 0 &&
    cSelected.sort((a, b) => a - b)[cSelected.length - 1] >= 4
      ? ""
      : "&characteristic[209][to]=" + cSelected.sort((a, b) => a - b)[cSelected.length - 1]
  }&characteristic[234][from]=${priceFrom}&characteristic[234][to]=${priceTo}&characteristic[242]=240&limit=${limit}&page=${
    currentPage - 1
  }`;
  const [{ response, isLoading }, doFetch] = useFetch(apiURL);

  useEffect(() => {
    async function getRate() {
      try {
        const res = await Axios.get(
          "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5"
        );
        setRate(res.data);
      } catch (error) {
        console.warn(error);
      }
    }

    getRate();
  }, []);

  let rateUSD = null;
  rate && rate.map((item) => (item.ccy.toLowerCase() === "usd" ? (rateUSD = item.buy) : ""));

  useEffect(() => {
    setLs({ priceFrom, priceTo, cityID, cSelected, currentPage });
    doFetch();
  }, [doFetch, priceFrom, priceTo, cityID, setLs, cSelected, currentPage]);

  useEffect(() => {
    if (!isLoading && response) setArrItems(response.items);
  }, [setArrItems, isLoading, response]);

  function handleChangePrice(element) {
    element.id === "priceFrom" ? setPriceFrom(element.value) : setPriceTo(element.value);
  }

  function onSubmit() {
    doFetch();
  }

  function handleSaved(data) {
    return;
  }

  function onCheckboxBtnClick(element) {
    const selected = parseInt(element.target.dataset.rooms);

    const index = cSelected.indexOf(selected);

    if (index < 0) {
      cSelected.push(selected);
    } else {
      cSelected.splice(index, 1);
    }
    setCSelected([...cSelected]);
  }

  function handleChangeCity(data) {
    setCityID(data.value);
  }

  function onChangePage(page) {
    setCurrentPage(page);
  }

  const indexOfLastCard = currentPage * limit;
  const indexOfFirstCard = indexOfLastCard - limit;

  return (
    <>
      <Row>
        <Col md="3">
          <Filter
            onChangeCountPrice={handleChangePrice}
            count_res={!isLoading && response ? response.count : 0}
            onSubmitForm={onSubmit}
            onCheckRooms={onCheckboxBtnClick}
            onChangeCity={handleChangeCity}
            valueFrom={ls ? ls.priceFrom : priceFrom}
            valueTo={ls ? ls.priceTo : priceTo}
            cSelected={cSelected}
            cityID={cityID}
          />
        </Col>
        <Col md="9">
          {isLoading ? (
            <Loader />
          ) : !isLoading && response && response.count > 0 ? (
            response.items
              .slice(indexOfFirstCard, indexOfLastCard)
              .map((id, key) => (
                <PreviewCard
                  key={key}
                  id={id}
                  location={location}
                  onChangeSaved={handleSaved}
                  rateUSD={rateUSD}
                  arrRes={response.items}
                />
              ))
          ) : (
            <NoSearchResult />
          )}
          {!isLoading && response && (
            <Pagination
              onChange={onChangePage}
              totalItemsCount={response.count <= 100 ? response.count : 100}
              itemsCountPerPage={limit}
              pageRangeDisplayed={10}
              activePage={currentPage}
              itemClass="page-item"
              linkClass="page-link"
            />
          )}
        </Col>
      </Row>
    </>
  );
};

export default Home;
